import { WebSocketServer, WebSocket } from 'ws';
import type { Hotspot, ScanStatus, WSMessage } from '../types';

let wss: WebSocketServer | null = null;

// 创建 WebSocket 服务器
export function createWebSocketServer(port: number): WebSocketServer {
  wss = new WebSocketServer({ port });

  console.log(`[WebSocket] Server running on port ${port}`);

  wss.on('connection', (ws, req) => {
    console.log(`[WebSocket] Client connected from ${req.socket.remoteAddress}`);

    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'PING',
      timestamp: new Date().toISOString()
    }));

    // 心跳检测
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('pong', () => {
      // 客户端响应了 ping
    });

    ws.on('message', (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', (error as Error).message);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      clearInterval(pingInterval);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Client error:', error.message);
    });
  });

  return wss;
}

// 处理客户端消息
function handleClientMessage(ws: WebSocket, message: WSMessage): void {
  switch (message.type) {
    case 'PING':
      ws.send(JSON.stringify({
        type: 'PONG',
        timestamp: new Date().toISOString()
      }));
      break;

    default:
      console.log('[WebSocket] Unknown message type:', message.type);
  }
}

// 广播消息给所有客户端
export function broadcast(data: WSMessage): void {
  if (!wss) {
    console.warn('[WebSocket] Server not initialized');
    return;
  }

  const message = JSON.stringify(data);
  let sentCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  console.log(`[WebSocket] Broadcast to ${sentCount} clients`);
}

// 广播新热点
export function broadcastHotspot(hotspot: Hotspot): void {
  broadcast({
    type: 'NEW_HOTSPOT',
    data: hotspot,
    timestamp: new Date().toISOString()
  });
}

// 广播扫描状态
export function broadcastScanStatus(status: ScanStatus): void {
  broadcast({
    type: status.is_scanning ? 'SCAN_START' : 'SCAN_COMPLETE',
    data: status,
    timestamp: new Date().toISOString()
  });
}
