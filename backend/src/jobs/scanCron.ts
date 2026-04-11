import cron from 'node-cron';
import { scannerService } from '../services/scanner';

let scanJob: cron.ScheduledTask | null = null;

// 启动定时扫描任务
export function startScanCron(): void {
  // 如果已有任务，先停止
  if (scanJob) {
    scanJob.stop();
  }

  // 从环境变量获取扫描间隔（默认 30 分钟）
  const intervalMinutes = parseInt(process.env.SCAN_INTERVAL_MINUTES || '30');

  // 转换为 cron 表达式
  // 例如：30 分钟 -> */30 * * * *
  const cronExpression = `*/${intervalMinutes} * * * *`;

  console.log(`[Cron] Starting scan job with interval: ${intervalMinutes} minutes`);

  scanJob = cron.schedule(cronExpression, async () => {
    console.log('[Cron] Running scheduled scan at', new Date().toISOString());
    try {
      await scannerService.startScan();
    } catch (error) {
      console.error('[Cron] Scheduled scan failed:', (error as Error).message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai' // 使用中国时区
  });
}

// 停止定时任务
export function stopScanCron(): void {
  if (scanJob) {
    scanJob.stop();
    scanJob = null;
    console.log('[Cron] Scan job stopped');
  }
}

// 立即执行一次扫描
export async function runScanNow(keywordIds?: number[]): Promise<void> {
  console.log('[Cron] Running immediate scan');
  await scannerService.startScan(keywordIds);
}

// 获取下次执行时间
export function getNextRunTime(): Date | null {
  // node-cron 没有直接提供下次执行时间的方法
  // 这里简单计算
  const intervalMinutes = parseInt(process.env.SCAN_INTERVAL_MINUTES || '30');
  const now = new Date();
  const nextMinute = Math.ceil(now.getMinutes() / intervalMinutes) * intervalMinutes;
  const nextRun = new Date(now);
  nextRun.setMinutes(nextMinute, 0, 0);

  if (nextRun <= now) {
    nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);
  }

  return nextRun;
}
