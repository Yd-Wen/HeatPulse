import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { scannerService } from '../services/scanner';

const router = Router();

// POST /api/scan/trigger - 手动触发扫描
router.post('/trigger', async (req, res) => {
  const { keyword_ids } = req.body || {};

  // 检查是否已有扫描正在进行
  const runningScan = await prisma.scanLog.findFirst({
    where: { status: 'running' }
  });

  if (runningScan) {
    return res.status(409).json({
      error: 'Scan already in progress',
      scan_id: runningScan.id,
      started_at: runningScan.started_at
    });
  }

  // 启动扫描（不等待完成）
  scannerService.startScan(keyword_ids).catch(console.error);

  res.json({
    success: true,
    message: 'Scan started',
    timestamp: new Date().toISOString()
  });
});

// GET /api/scan/status - 获取扫描状态
router.get('/status', async (req, res) => {
  const runningScan = await prisma.scanLog.findFirst({
    where: { status: 'running' }
  });

  const lastScan = await prisma.scanLog.findFirst({
    where: {
      status: { in: ['completed', 'failed'] },
      ended_at: { not: null }
    },
    orderBy: { ended_at: 'desc' }
  });

  const scanInterval = parseInt(process.env.SCAN_INTERVAL_MINUTES || '30');
  const nextScanTime = lastScan?.ended_at
    ? new Date(lastScan.ended_at.getTime() + scanInterval * 60000)
    : null;

  res.json({
    is_scanning: !!runningScan,
    current_scan: runningScan ? {
      id: runningScan.id,
      started_at: runningScan.started_at,
      keywords_count: runningScan.keywords_count
    } : null,
    last_scan: lastScan ? {
      id: lastScan.id,
      started_at: lastScan.started_at,
      ended_at: lastScan.ended_at,
      status: lastScan.status,
      hotspots_found: lastScan.hotspots_found
    } : null,
    next_scan: nextScanTime?.toISOString() || null
  });
});

export default router;
