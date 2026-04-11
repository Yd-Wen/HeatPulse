import { prisma } from '../../utils/prisma';
import { fetchAllSources } from './sources';
import { analyzeContent } from '../ai/openrouter';
import { broadcastHotspot, broadcastScanStatus } from '../websocket';
import type { SourceResult, ScanStatus } from '../../types';

// 扫描服务状态
let isScanning = false;
let lastScanTime: Date | null = null;

// 启动时清理异常的扫描记录（之前崩溃遗留的）
export async function cleanupStuckScans(): Promise<void> {
  try {
    console.log('[Scanner] Checking for stuck scans...');

    const stuckScans = await prisma.scanLog.findMany({
      where: { status: 'running' }
    });

    console.log(`[Scanner] Found ${stuckScans.length} stuck scan(s)`);

    for (const scan of stuckScans) {
      const scanAge = Date.now() - scan.started_at.getTime();
      const ageMinutes = Math.round(scanAge / 60000);
      console.log(`[Scanner] Scan #${scan.id} is ${ageMinutes} minutes old`);

      // 如果扫描开始时间超过 2 分钟，就认为是异常记录（缩短时间以便更快恢复）
      if (scanAge > 2 * 60 * 1000) {
        await prisma.scanLog.update({
          where: { id: scan.id },
          data: {
            status: 'failed',
            ended_at: new Date(),
            error: 'Scan was interrupted (server restarted or crashed)'
          }
        });
        console.log(`[Scanner] Cleaned up stuck scan #${scan.id}`);
      }
    }
  } catch (error) {
    console.error('[Scanner] Failed to cleanup stuck scans:', (error as Error).message);
  }
}

// 扫描服务
export const scannerService = {
  // 是否正在扫描
  isScanning(): boolean {
    return isScanning;
  },

  // 获取最后扫描时间
  getLastScanTime(): Date | null {
    return lastScanTime;
  },

  // 开始扫描
  async startScan(keywordIds?: number[]): Promise<void> {
    if (isScanning) {
      console.log('[Scanner] Scan already in progress');
      return;
    }

    isScanning = true;
    console.log('[Scanner] Starting scan at', new Date().toISOString());

    // 广播扫描开始
    broadcastScanStatus({
      is_scanning: true,
      last_scan: lastScanTime?.toISOString(),
      next_scan: undefined
    });

    // 创建扫描日志
    const scanLog = await prisma.scanLog.create({
      data: {
        status: 'running',
        started_at: new Date()
      }
    });

    try {
      // 获取要扫描的关键词
      let keywords = await prisma.keyword.findMany({
        where: {
          is_active: true,
          ...(keywordIds && keywordIds.length > 0 && { id: { in: keywordIds } })
        }
      });

      if (keywords.length === 0) {
        console.log('[Scanner] No active keywords to scan');
        await prisma.scanLog.update({
          where: { id: scanLog.id },
          data: {
            status: 'completed',
            ended_at: new Date(),
            keywords_count: 0,
            hotspots_found: 0
          }
        });
        isScanning = false;
        return;
      }

      console.log(`[Scanner] Scanning ${keywords.length} keywords`);

      // 更新扫描日志中的关键词数量
      await prisma.scanLog.update({
        where: { id: scanLog.id },
        data: { keywords_count: keywords.length }
      });

      // 获取所有数据源的数据
      const keywordStrings = keywords.map(k => k.keyword);
      const sourceResults = await fetchAllSources(keywordStrings);

      console.log(`[Scanner] Found ${sourceResults.length} items from sources`);

      let hotspotsFound = 0;

      // AI 分析并保存热点
      for (const result of sourceResults) {
        try {
          // 检查是否已存在相同 URL 的热点
          const existing = await prisma.hotspot.findFirst({
            where: {
              OR: [
                { source_url: result.url },
                { title: result.title }
              ]
            }
          });

          if (existing) {
            console.log(`[Scanner] Hotspot already exists: ${result.title}`);
            continue;
          }

          // AI 分析
          const analysis = await analyzeContent(
            result.title,
            result.summary,
            result.source
          );

          // 只保存真实度超过 60 分的热点
          if (analysis.authenticity_score < 60) {
            console.log(`[Scanner] Skipping low authenticity: ${result.title}`);
            continue;
          }

          // 找到匹配的关键词
          const matchedKeyword = keywords.find(k =>
            result.title.toLowerCase().includes(k.keyword.toLowerCase()) ||
            result.summary.toLowerCase().includes(k.keyword.toLowerCase())
          );

          // 创建热点记录
          const hotspot = await prisma.hotspot.create({
            data: {
              title: result.title,
              content: result.summary,
              source_url: result.url,
              source_type: result.source,
              keyword_id: matchedKeyword?.id || null,
              relevance_score: analysis.authenticity_score,
              is_fake: !analysis.is_real,
              ai_summary: analysis.summary,
              ai_tags: JSON.stringify(analysis.tags),
              importance: analysis.importance,
              published_at: result.timestamp
            },
            include: {
              keyword: matchedKeyword ? {
                select: {
                  id: true,
                  keyword: true,
                  category: true
                }
              } : false
            }
          });

          hotspotsFound++;
          console.log(`[Scanner] Created hotspot: ${hotspot.title}`);

          // 广播新热点
          broadcastHotspot({
            ...hotspot,
            ai_tags: analysis.tags
          });

          // 如果有匹配的关键词且设置了通知邮箱，发送邮件
          if (matchedKeyword?.notify_email) {
            try {
              const { sendHotspotEmail } = await import('../email');
              // 转换 ai_tags 为数组格式
              const hotspotForEmail = {
                ...hotspot,
                ai_tags: hotspot.ai_tags ? JSON.parse(hotspot.ai_tags) : undefined
              };
              await sendHotspotEmail(matchedKeyword.notify_email, hotspotForEmail);
              console.log(`[Scanner] Email sent to ${matchedKeyword.notify_email}`);
            } catch (emailError) {
              console.error('[Scanner] Failed to send email:', (emailError as Error).message);
            }
          }

          // 延迟以避免速率限制
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('[Scanner] Failed to process result:', (error as Error).message);
        }
      }

      // 更新扫描日志
      await prisma.scanLog.update({
        where: { id: scanLog.id },
        data: {
          status: 'completed',
          ended_at: new Date(),
          hotspots_found: hotspotsFound
        }
      });

      lastScanTime = new Date();
      console.log(`[Scanner] Scan completed. Found ${hotspotsFound} new hotspots`);

    } catch (error) {
      console.error('[Scanner] Scan failed:', (error as Error).message);

      await prisma.scanLog.update({
        where: { id: scanLog.id },
        data: {
          status: 'failed',
          ended_at: new Date(),
          error: (error as Error).message
        }
      });
    } finally {
      isScanning = false;

      // 广播扫描完成
      const scanInterval = parseInt(process.env.SCAN_INTERVAL_MINUTES || '30');
      broadcastScanStatus({
        is_scanning: false,
        last_scan: lastScanTime?.toISOString(),
        next_scan: new Date(Date.now() + scanInterval * 60000).toISOString()
      });
    }
  }
};
