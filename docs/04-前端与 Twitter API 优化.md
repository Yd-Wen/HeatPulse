# 前端与 Twitter API 优化计划

## 需求概述

1. 在仪表盘顶部添加"快速添加关键词"区块
2. 热点卡片显示更详细的来源（X/B站/微博/百度等）
3. useWebSocket 改为应用级实现，解决页面切换报错
4. 修复 Twitter API 调用（使用正确端点）

---

## 关键文件

| 文件 | 操作 |
|------|------|
| `frontend/src/contexts/WebSocketContext.tsx` | 新建 - 应用级 WebSocket Context |
| `frontend/src/hooks/useWebSocket.ts` | 修改 - 改为使用 Context |
| `frontend/src/App.tsx` | 修改 - 包裹 WebSocket Provider |
| `frontend/src/pages/Dashboard.tsx` | 修改 - 添加快速添加关键词区块 |
| `frontend/src/components/hotspots/HotspotCard.tsx` | 修改 - 优化来源显示 |
| `frontend/src/types/index.ts` | 修改 - 扩展 source_type 类型 |
| `backend/src/services/scanner/sources/twitter.ts` | 修改 - 修复 API 调用 |

---

## 问题分析

### 1. WebSocket 切换页面报错

**现象**:
```
useWebSocket.ts:55 WebSocket connection to 'ws://localhost:3002/' failed
useWebSocket.ts:38 WebSocket error: Event {isTrusted: true, type: 'error', ...}
```

**原因**: 当前 useWebSocket 是组件级实现，页面切换时 Dashboard 组件卸载导致连接断开，返回时重新建立连接失败。

**解决方案**: 创建 WebSocketContext，在 App.tsx 中提供全局单例连接。

### 2. 热点来源显示不够详细

**当前显示**: Twitter / 搜索 / API

**目标显示**: X / B站 / 微博 / 百度 / 知乎 / 搜索

### 3. Twitter API 调用失败

**现象**:
```
[Twitter] Failed to fetch tweets [404]: Request failed with status code 404
{"detail": "Not Found"}
```

**原因**: 当前代码使用 POST 请求 + `X-API-Key` 头，但 twitterapi.io 的 Advanced Search API 实际需要 GET 请求。

---

## 实现方案

### 1. WebSocket 应用级实现

创建 `WebSocketContext.tsx`，提供全局单例连接：

```typescript
// frontend/src/contexts/WebSocketContext.tsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface WSMessage {
  type: string;
  data?: any;
  timestamp: string;
}

interface WebSocketContextType {
  connected: boolean;
  lastMessage: WSMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  lastMessage: null,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => setConnected(true);
    wsRef.current.onclose = () => setConnected(false);
    wsRef.current.onmessage = (event) => {
      setLastMessage(JSON.parse(event.data));
    };

    return () => wsRef.current?.close();
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
```

修改 `App.tsx`:
```typescript
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <Layout>
          <Routes>...</Routes>
        </Layout>
      </WebSocketProvider>
    </BrowserRouter>
  );
}
```

### 2. 仪表盘快速搜索

**UI 调整**:
- Header 区域的"立即扫描"按钮 → 改为"开始扫描"（扫描所有启用的关键词）
- 关键词输入框后面只保留一个"立即扫描"按钮（将关键词添加到数据库并仅扫描该关键词）

**实现** (`Dashboard.tsx`):

```tsx
{/* Header 区域 */}
<Button onClick={handleScanAll} loading={triggering} variant="secondary">
  <Play className="w-4 h-4" />
  开始扫描
</Button>

{/* 快速搜索区域 */}
<Card className="bg-gradient-to-r from-[#1a1a25] to-[#0f0f15] border border-[#2a2a3a]">
  <form onSubmit={handleQuickScan} className="flex flex-col sm:flex-row gap-3">
    <Input
      placeholder="输入关键词快速搜索热点..."
      value={quickKeyword}
      onChange={(e) => setQuickKeyword(e.target.value)}
      className="flex-1"
    />
    <Button type="submit" disabled={!quickKeyword.trim()}>
      <Zap className="w-4 h-4" />
      立即扫描
    </Button>
  </form>
</Card>
```

**功能逻辑**:
- `handleScanAll`: 调用 `scanApi.trigger()` 扫描所有已启用的关键词
- `handleQuickScan`: 先创建关键词（启用状态），然后调用 `scanApi.trigger([keywordId])` 只扫描该关键词

### 3. 来源显示优化（前后端同时更新）

**前端类型扩展** (`frontend/src/types/index.ts`):

```typescript
source_type: 'twitter' | 'bilibili' | 'weibo' | 'baidu' | 'zhihu' | 'search';
```

**后端数据源映射** (`backend/src/services/scanner/sources/*.ts`):

存储时使用具体来源:
- `web.ts` 微博 → `weibo`
- `web.ts` 百度 → `baidu`
- `web.ts` 知乎 → `zhihu`
- `bilibili.ts` → `bilibili`
- `twitter.ts` → `twitter`

**前端显示** (`HotspotCard.tsx`):

```tsx
// 来源标签映射（只保留 label）
const sourceLabels: Record<string, string> = {
  twitter: 'X',
  bilibili: 'B站',
  weibo: '微博',
  baidu: '百度',
  zhihu: '知乎',
  search: '搜索',
  api: 'API',
};

// 使用方式
<Badge variant="info" size="sm">
  {sourceLabels[hotspot.source_type] || hotspot.source_type}
</Badge>
```

**说明**: 仪表盘和热点列表统一使用 HotspotCard 组件，来源只显示文字 label，不显示图标。

### 4. 后端来源存储修复

**问题**: `backend/src/services/scanner/index.ts` 第 165 行对 `source_type` 做了类型断言：
```typescript
source_type: result.source as 'search' | 'twitter' | 'api',
```
这导致虽然数据源返回了 'bilibili', 'weibo', 'zhihu' 等值，但 TypeScript 类型限制可能导致问题。

**修复**: 移除类型断言，直接保存 `result.source`：
```typescript
source_type: result.source,
```

### 5. Twitter API 修复

**正确调用方式** (基于 twitterapi.io 文档):

- **端点**: `GET /twitter/tweet/advanced_search`
- **参数**: `query` (string, 必填), `max_results` (可选，默认100)
- **认证**: `X-API-Key` 头

**修复代码** (`twitter.ts`):

```typescript
async function fetchTwitterTweets(query: string): Promise<SourceResult[]> {
  try {
    const response = await axios.get(
      'https://api.twitterapi.io/twitter/tweet/advanced_search',
      {
        headers: {
          'X-API-Key': getApiKey(),
          'Accept': 'application/json'
        },
        params: {
          query,
          max_results: 20
        },
        timeout: 15000
      }
    );

    const results: SourceResult[] = [];

    // 根据实际响应格式调整字段映射
    if (response.data?.tweets) {
      for (const tweet of response.data.tweets) {
        results.push({
          title: tweet.text ? tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : '') : '无内容',
          summary: tweet.text || '',
          url: tweet.url || `https://twitter.com/i/status/${tweet.id}`,
          source: 'twitter',
          heat: (tweet.retweetCount || 0) + (tweet.likeCount || 0),
          timestamp: new Date(tweet.createdAt)
        });
      }
    }

    return results;
  } catch (error: any) {
    const statusCode = error?.response?.status;
    console.error(`[Twitter] Failed to fetch tweets [${statusCode}]:`, (error as Error).message);
    return [];
  }
}
```

---

## 执行顺序

1. 创建 `WebSocketContext.tsx`（全局单例）
2. 修改 `useWebSocket.ts` 使用 Context
3. 修改 `App.tsx` 包裹 Provider
4. 修复 Twitter API 调用
5. 扩展 `source_type` 类型（前后端）
6. 修改 `HotspotCard` 显示更详细来源
7. 在 `Dashboard` 添加快速添加关键词区块

---

## 修改记录

### 已完成 ✅

| 文件 | 修改内容 |
|------|----------|
| `frontend/src/contexts/WebSocketContext.tsx` | 新建 - 全局 WebSocket Context，解决页面切换报错 |
| `frontend/src/hooks/useWebSocket.ts` | 修改 - 改为从 Context 导出 |
| `frontend/src/App.tsx` | 修改 - 使用 `WebSocketProvider` 包裹应用 |
| `frontend/src/pages/Dashboard.tsx` | 修改 - 添加快速搜索区块，Header 按钮改为"开始扫描" |
| `frontend/src/components/hotspots/HotspotCard.tsx` | 修改 - 统一来源显示，只保留 label 去掉 icon |
| `frontend/src/components/hotspots/HotspotList.tsx` | 修改 - 使用导入的 HotspotCard |
| `frontend/src/pages/Hotspots.tsx` | 修改 - 使用导入的 HotspotCard 确保来源显示一致 |
| `frontend/src/types/index.ts` | 修改 - 扩展 source_type 类型 |
| `frontend/src/api/client.ts` | 修改 - scanApi.trigger 支持传入 keywordIds 参数 |
| `backend/src/services/scanner/sources/twitter.ts` | 修改 - 优化字段映射兼容 twitterapi.io 响应 |
| `backend/src/services/scanner/index.ts` | 修改 - 移除 source_type 类型断言，保存完整来源值 |

---

## 验证方式

1. 启动前端和后端
2. 测试页面切换（Dashboard → Keywords → Dashboard），不再报 WebSocket 错误
3. 在仪表盘快速添加关键词，验证功能正常
4. 触发扫描，检查热点来源显示正确（X/B站/微博/百度/知乎等）