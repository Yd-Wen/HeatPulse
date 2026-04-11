import app from './app';
import { createWebSocketServer } from './services/websocket';
import { startScanCron } from './jobs/scanCron';
import { cleanupStuckScans } from './services/scanner';

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Start HTTP server
const server = app.listen(PORT, async () => {
  console.log(`[Server] HTTP server running on port ${PORT}`);

  // 清理之前崩溃遗留的扫描记录
  await cleanupStuckScans();
});

// Start WebSocket server
createWebSocketServer(WS_PORT as number);

// Start cron jobs
startScanCron();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});
