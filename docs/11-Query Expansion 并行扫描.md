# Query Expansion 并行扫描方案

## 背景

当前 `fetchAllSources` 函数是**串行**处理：每个关键词依次请求各个数据源。当有多个查询变体（如 3 关键词 × 6 变体 = 18 个搜索词）时，效率很低。

用户需求：用并行请求替代串行，提高扫描效率。

**选择**：
- 并行粒度：完全并行（每个变体 × 每个数据源独立）
- 最大并发：5 个
- 部分失败：继续其他请求

---

## 实现方案

### 1. 安装并发限制库

```bash
npm install p-limit
```

依赖文件：`backend/package.json`

### 2. 修改 fetchAllSources 函数

**文件**: `backend/src/services/scanner/sources/index.ts`

**核心改动**：
- 使用 `p-limit` 控制并发数为 5
- 将「关键词 × 数据源」的组合拆分为独立任务
- 所有任务并行执行，失败不影响其他

```typescript
import pLimit from 'p-limit';

// 限制并发数为 5
const limit = pLimit(5);

// 任务生成函数：为每个(关键词, 数据源)组合创建任务
function createTasks(keywords: string[], sources: string[]) {
  const tasks: Array<() => Promise<SourceResult[]>> = [];

  for (const keyword of keywords) {
    const isAccount = isAccountQuery(keyword);
    const parsed = isAccount ? parseAccountQuery(keyword) : null;

    // Bilibili 任务
    if (sources.includes('bilibili')) {
      if (!isAccount || parsed?.platform === 'bilibili' || !parsed?.platform) {
        tasks.push(() => limit(() => fetchBilibiliHot(keyword).finally(() => randomDelay(1000, 2000))));
      }
    }

    // Twitter 任务
    if (sources.includes('twitter')) {
      if (!isAccount || parsed?.platform === 'twitter' || !parsed?.platform) {
        const twKeyword = isAccount ? parsed!.username : keyword;
        tasks.push(() => limit(() => fetchTwitterSearch(twKeyword).finally(() => randomDelay(10000, 15000))));
      }
    }

    // Sogou 任务（非账号查询）
    if (sources.includes('sogou') && !isAccount) {
      tasks.push(() => limit(() => searchSogou(keyword, 10).finally(() => randomDelay(3000, 5000))));
    }
  }

  return tasks;
}

// 修改后的 fetchAllSources
export async function fetchAllSources(keywords: string[], selectedSources?: string[]): Promise<SourceResult[]> {
  const sources = selectedSources?.length ? selectedSources : ['bilibili', 'twitter', 'sogou'];

  // 创建所有任务
  const tasks = createTasks(keywords, sources);
  console.log(`[Sources] Created ${tasks.length} tasks with concurrency limit of 5`);

  // 并行执行所有任务（受限于 5 个并发）
  const taskResults = await Promise.allSettled(tasks.map(task => task()));

  // 收集结果
  const results: SourceResult[] = [];
  const errors: string[] = [];

  for (const result of taskResults) {
    if (result.status === 'fulfilled' && result.value) {
      results.push(...result.value);
    } else if (result.status === 'rejected') {
      errors.push((result.reason as Error).message);
    }
  }

  // 去重
  const uniqueResults = deduplicateResults(results);

  if (errors.length > 0) {
    console.log(`[Sources] ${errors.length} tasks failed:`, errors.slice(0, 5).join('; '));
  }

  return uniqueResults;
}
```

### 3. 确保 randomDelay 在任务内部调用

各数据源函数内部已有随机延迟逻辑，但为了更安全，我们在任务包装层也加上延迟调用（见上方代码的 `.finally()` 中的 `randomDelay`）。

---

## 关键文件

| 文件 | 操作 |
|------|------|
| `backend/package.json` | 添加 `p-limit` 依赖 |
| `backend/src/services/scanner/sources/index.ts` | 重构 `fetchAllSources` 为并行执行 |

---

## 验证方案

1. 安装依赖后运行后端
2. 手动触发一次扫描，观察日志输出：
   - 应该有 `[Sources] Created X tasks with concurrency limit of 5` 的日志
   - 观察请求是否真正并行（时间戳更密集）
3. 检查扫描结果数量是否与串行时一致
4. 监控是否有被数据源封禁的情况

---

## 风险与注意事项

1. **Twitter API 限制**: 并发请求可能触发 Twitter 的速率限制，建议观察实际效果后调整并发数
2. **搜狗搜索**: 并发请求搜狗可能被临时封 IP，需要监控
3. **p-limit 库**: 使用 `Promise.allSettled` 确保部分失败不影响整体