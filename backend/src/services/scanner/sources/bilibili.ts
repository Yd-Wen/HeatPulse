import axios from 'axios';
import type { SourceResult } from '../../../types';
import { getRandomUserAgent, isAccountQuery, parseAccountQuery } from './index';

const BASE_URL = 'https://api.bilibili.com';

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
    const response = await axios.get(`${BASE_URL}/x/web-interface/popular`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://www.bilibili.com',
      },
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
    const response = await axios.get(`${BASE_URL}/x/web-interface/search/type`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://search.bilibili.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
      },
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
    // 先搜索用户
    const searchResponse = await axios.get(`${BASE_URL}/x/web-interface/search/type`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': 'https://search.bilibili.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
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
