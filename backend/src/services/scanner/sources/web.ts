import axios from 'axios';
import type { SourceResult } from '../../../types';
import { getRandomUserAgent, randomDelay } from './index';

// 获取微博热搜
export async function fetchWeiboHotSearch(): Promise<SourceResult[]> {
  try {
    const response = await axios.get('https://weibo.com/ajax/side/hotSearch', {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://weibo.com/',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 10000
    });

    const data = response.data;
    const results: SourceResult[] = [];

    if (data?.data?.realtime) {
      for (const item of data.data.realtime.slice(0, 20)) {
        results.push({
          title: item.note || item.word || '无标题',
          summary: item.category ? `[${item.category}] ${item.note || ''}` : (item.note || ''),
          url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word || item.note)}`,
          source: 'weibo',
          heat: item.raw_hot || item.num || 0,
          timestamp: new Date()
        });
      }
    }

    return results;
  } catch (error) {
    console.error('[Weibo] Failed to fetch hot search:', (error as Error).message);
    return [];
  }
}

// 获取知乎热榜
export async function fetchZhihuHot(): Promise<SourceResult[]> {
  try {
    const response = await axios.get('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total', {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://www.zhihu.com/',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const results: SourceResult[] = [];

    if (response.data?.data) {
      for (const item of response.data.data.slice(0, 20)) {
        const target = item.target || item;
        results.push({
          title: target.title || '无标题',
          summary: target.excerpt || target.desc || '',
          url: target.url || `https://zhihu.com/question/${target.id}`,
          source: 'zhihu',
          heat: item.detail_text ? parseInt(item.detail_text.replace(/[^0-9]/g, '')) || 0 : 0,
          timestamp: new Date()
        });
      }
    }

    return results;
  } catch (error) {
    console.error('[Zhihu] Failed to fetch hot list:', (error as Error).message);
    return [];
  }
}

// 通用网页搜索（基于关键词）
export async function searchWeb(keyword: string): Promise<SourceResult[]> {
  const results: SourceResult[] = [];

  // 尝试获取微博热搜
  try {
    const weiboResults = await fetchWeiboHotSearch();
    const filtered = weiboResults.filter(r =>
      r.title.toLowerCase().includes(keyword.toLowerCase()) ||
      r.summary.toLowerCase().includes(keyword.toLowerCase())
    );
    results.push(...filtered);
  } catch (e) {
    console.error('[Web] Weibo search failed:', (e as Error).message);
  }

  await randomDelay(3000, 5000);

  // 尝试获取知乎热榜
  try {
    const zhihuResults = await fetchZhihuHot();
    const filtered = zhihuResults.filter(r =>
      r.title.toLowerCase().includes(keyword.toLowerCase()) ||
      r.summary.toLowerCase().includes(keyword.toLowerCase())
    );
    results.push(...filtered);
  } catch (e) {
    console.error('[Web] Zhihu search failed:', (e as Error).message);
  }

  return results;
}
