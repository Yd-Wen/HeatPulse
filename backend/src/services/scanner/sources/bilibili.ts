import axios from 'axios';
import type { SourceResult } from '../../../types';
import { getRandomUserAgent, isAccountQuery, parseAccountQuery, randomDelay } from './index';

const BASE_URL = 'https://api.bilibili.com';

// 生成 buvid3 Cookie (B站反爬虫需要)
function generateBuvid3(): string {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return `${uuid}infoc`;
}

// 获取 B站请求头
function getBilibiliHeaders(): Record<string, string> {
  const buvid3 = generateBuvid3();
  return {
    'User-Agent': getRandomUserAgent(),
    'Referer': 'https://search.bilibili.com/',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cookie': `buvid3=${buvid3}`,
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Origin': 'https://search.bilibili.com',
  };
}

// 获取 B站热门视频
export async function fetchBilibiliHot(keyword?: string): Promise<SourceResult[]> {
  if (keyword && isAccountQuery(keyword)) {
    const { username, platform } = parseAccountQuery(keyword);
    if (platform === 'bilibili' || !platform) {
      return fetchBilibiliUserInfo(username);
    }
    return [];
  }

  if (keyword) {
    return searchBilibiliVideos(keyword);
  }

  return fetchBilibiliPopular();
}

// 获取热门视频列表
async function fetchBilibiliPopular(): Promise<SourceResult[]> {
  try {
    await randomDelay(500, 1500);

    const headers = getBilibiliHeaders();
    headers['Referer'] = 'https://www.bilibili.com';

    const response = await axios.get(`${BASE_URL}/x/web-interface/popular`, {
      headers,
      params: { ps: 20 },
      timeout: 10000
    });

    const results: SourceResult[] = [];

    if (response.data?.data?.list) {
      for (const item of response.data.data.list) {
        results.push({
          title: item.title || '无标题',
          summary: item.desc || item.owner?.name || '',
          url: `https://www.bilibili.com/video/${item.bvid}`,
          source: 'bilibili',
          heat: item.stat?.view || 0,
          timestamp: new Date(item.pubdate * 1000)
        });
      }
    }

    return results;
  } catch (error) {
    console.error('[Bilibili] Failed to fetch popular:', (error as Error).message);
    return [];
  }
}

// 搜索视频
async function searchBilibiliVideos(keyword: string): Promise<SourceResult[]> {
  try {
    // 添加延迟避免触发反爬虫
    await randomDelay(1000, 3000);

    const response = await axios.get(`${BASE_URL}/x/web-interface/search/type`, {
      headers: getBilibiliHeaders(),
      params: {
        keyword,
        search_type: 'video',
        page: 1,
        pagesize: 10
      },
      timeout: 15000
    });

    const results: SourceResult[] = [];

    if (response.data?.data?.result) {
      for (const item of response.data.data.result.slice(0, 10)) {
        results.push({
          title: item.title ? item.title.replace(/<[^>]+>/g, '') : '无标题',
          summary: item.description || item.author || '',
          url: `https://www.bilibili.com/video/${item.bvid}`,
          source: 'bilibili',
          heat: item.play || 0,
          timestamp: new Date(item.pubdate * 1000)
        });
      }
    }

    return results;
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const responseData = error?.response?.data;
    console.error(`[Bilibili] Failed to search videos [${statusCode}]:`, (error as Error).message);
    if (responseData) {
      console.error('[Bilibili] Response:', JSON.stringify(responseData, null, 2));
    }
    return [];
  }
}

// 获取 B站用户信息
async function fetchBilibiliUserInfo(username: string): Promise<SourceResult[]> {
  try {
    await randomDelay(1000, 2000);

    // 先搜索用户
    const searchResponse = await axios.get(`${BASE_URL}/x/web-interface/search/type`, {
      headers: getBilibiliHeaders(),
      params: {
        keyword: username,
        search_type: 'bili_user',
        page: 1,
        pagesize: 5
      },
      timeout: 15000
    });

    const results: SourceResult[] = [];

    if (searchResponse.data?.data?.result) {
      for (const user of searchResponse.data.data.result.slice(0, 3)) {
        results.push({
          title: `@${user.uname} - B站用户`,
          summary: `粉丝: ${formatNumber(user.fans)}, 视频: ${user.videos}`,
          url: `https://space.bilibili.com/${user.mid}`,
          source: 'bilibili',
          heat: user.fans || 0,
          timestamp: new Date(),
          isAccount: true,
          accountInfo: {
            avatar: user.upic,
            followers: user.fans,
            description: user.usign || ''
          }
        });
      }
    }

    return results;
  } catch (error) {
    console.error('[Bilibili] Failed to fetch user info:', (error as Error).message);
    return [];
  }
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}
