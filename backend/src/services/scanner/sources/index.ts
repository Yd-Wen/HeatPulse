import type { SourceResult } from '../../../types';
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

// 多源获取数据
export async function fetchAllSources(keywords: string[], selectedSources?: string[]): Promise<SourceResult[]> {
  const results: SourceResult[] = [];
  const errors: string[] = [];

  // 如果没有指定源，默认使用所有源
  const sources = selectedSources?.length ? selectedSources : ['bilibili', 'twitter', 'sogou'];
  const shouldFetchBilibili = sources.includes('bilibili');
  const shouldFetchTwitter = sources.includes('twitter');
  const shouldFetchSogou = sources.includes('sogou');

  for (const keyword of keywords) {
    const isAccount = isAccountQuery(keyword);

    try {
      // 1. B站热门/搜索
      if (shouldFetchBilibili) {
        try {
          const parsed = isAccount ? parseAccountQuery(keyword) : null;
          const platform = parsed?.platform;

          // 只有明确指定 bilibili 平台或不是账号查询时才调用 B站
          if (!isAccount || platform === 'bilibili' || !platform) {
            const bilibiliResults = await fetchBilibiliHot(keyword);
            results.push(...bilibiliResults);
          }
          await randomDelay(1000, 2000); // B站限制较严格
        } catch (e) {
          errors.push(`Bilibili: ${(e as Error).message}`);
        }
      }

      // 2. Twitter/X 搜索
      if (shouldFetchTwitter) {
        try {
          const parsed = isAccount ? parseAccountQuery(keyword) : null;
          const platform = parsed?.platform;

          // 只有明确指定 twitter 平台或不是账号查询时才调用 Twitter
          if (!isAccount || platform === 'twitter' || !platform) {
            const twitterResults = await fetchTwitterSearch(isAccount ? parsed!.username : keyword);
            results.push(...twitterResults);
          }
          await randomDelay(10000, 15000); // Twitter API 限制较严格
        } catch (e) {
          errors.push(`Twitter: ${(e as Error).message}`);
        }
      }

      // 3. 搜狗搜索（仅非账号查询）
      if (shouldFetchSogou && !isAccount) {
        try {
          const sogouResults = await searchSogou(keyword, 10);
          results.push(...sogouResults);
          await randomDelay(3000, 5000);
        } catch (e) {
          errors.push(`Sogou: ${(e as Error).message}`);
        }
      }
    } catch (error) {
      errors.push(`Keyword "${keyword}": ${(error as Error).message}`);
    }
  }

  // 去重
  const uniqueResults = deduplicateResults(results);

  if (errors.length > 0) {
    console.log('[Sources] Some sources failed:', errors);
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
