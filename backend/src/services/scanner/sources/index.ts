import type { SourceResult } from '../../../types';
import pLimit from 'p-limit';
import { fetchBilibiliHot } from './bilibili';
import { fetchTwitterSearch } from './twitter';
import { searchSogou } from './sogou';

// 判断是否为账号查询（以 @ 开头）
export function isAccountQuery(keyword: string): boolean {
  return keyword.startsWith('@') && keyword.length > 1;
}

// 从关键词中提取平台信息（如 @用户名@平台）
export function parseAccountQuery(keyword: string): { username: string; platform?: string } {
  const cleanKeyword = keyword.slice(1); // 去掉 @

  // 检查是否包含平台标识，如 @用户名@bilibili
  const parts = cleanKeyword.split('@');
  if (parts.length === 2) {
    return { username: parts[0], platform: parts[1].toLowerCase() };
  }

  return { username: cleanKeyword };
}

// 延迟函数
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 随机延迟（用于避免被封）
export async function randomDelay(minMs: number = 3000, maxMs: number = 5000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await sleep(delay);
}

// 获取随机 User-Agent
export function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

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

// 多源获取数据（并行执行）
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

// 根据 URL 去重
function deduplicateResults(results: SourceResult[]): SourceResult[] {
  const seen = new Set<string>();
  return results.filter(r => {
    const key = r.url || r.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
