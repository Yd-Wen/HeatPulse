import axios from 'axios';
import type { SourceResult } from '../../../types';
import { getRandomUserAgent, isAccountQuery, parseAccountQuery } from './index';

const API_BASE_URL = 'https://api.twitterapi.io/api';

// 获取 Twitter API Key
function getApiKey(): string {
  const key = process.env.TWITTER_API_KEY;
  if (!key) {
    throw new Error('TWITTER_API_KEY is not configured');
  }
  return key;
}

// Twitter 搜索
export async function fetchTwitterSearch(keyword: string): Promise<SourceResult[]> {
  try {
    const isAccount = isAccountQuery(keyword);

    if (isAccount) {
      // 搜索用户
      const { username } = parseAccountQuery(keyword);
      return fetchTwitterUser(username);
    }

    // 搜索推文
    return fetchTwitterTweets(keyword);
  } catch (error) {
    console.error('[Twitter] Failed to search:', (error as Error).message);
    return [];
  }
}

// 搜索推文
async function fetchTwitterTweets(query: string): Promise<SourceResult[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/twitter/tweet/advanced_search`, {
      headers: {
        'X-API-Key': getApiKey(),
        'Accept': 'application/json'
      },
      params: {
        query,
        max_results: 20
      },
      timeout: 15000
    });

    const results: SourceResult[] = [];

    // 根据 twitterapi.io 文档调整字段映射
    // 响应格式: { tweets: [...], has_next_page, next_cursor }
    if (response.data?.tweets && Array.isArray(response.data.tweets)) {
      for (const tweet of response.data.tweets) {
        const author = tweet.author || {};
        const username = author.userName || 'i';
        const tweetId = tweet.id;

        results.push({
          title: tweet.text ? tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : '') : '无内容',
          summary: tweet.text || '',
          url: tweet.url || `https://twitter.com/${username}/status/${tweetId}`,
          source: 'twitter',
          heat: (tweet.retweetCount || 0) + (tweet.likeCount || 0),
          timestamp: new Date(tweet.createdAt)
        });
      }
    }

    return results;
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const responseData = error?.response?.data;
    console.error(`[Twitter] Failed to fetch tweets [${statusCode}]:`, (error as Error).message);
    if (responseData) {
      console.error('[Twitter] Response:', JSON.stringify(responseData, null, 2));
    }
    return [];
  }
}

// 获取用户信息
async function fetchTwitterUser(username: string): Promise<SourceResult[]> {
  try {
    const cleanUsername = username.replace('@', '');

    const response = await axios.get(`${API_BASE_URL}/twitter/user/info`, {
      headers: {
        'X-API-Key': getApiKey(),
        'Accept': 'application/json'
      },
      params: {
        userName: cleanUsername
      },
      timeout: 15000
    });

    const user = response.data;
    if (!user) return [];

    return [{
      title: `@${user.userName} - ${user.name || 'Twitter用户'}`,
      summary: `${user.description || ''}\n粉丝: ${formatNumber(user.followersCount)}, 推文: ${formatNumber(user.statusesCount)}`,
      url: `https://twitter.com/${user.userName}`,
      source: 'twitter',
      heat: user.followersCount || 0,
      timestamp: new Date(),
      isAccount: true,
      accountInfo: {
        avatar: user.profilePicUrl,
        followers: user.followersCount,
        description: user.description
      }
    }];
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const responseData = error?.response?.data;
    console.error(`[Twitter] Failed to fetch user [${statusCode}]:`, (error as Error).message);
    if (responseData) {
      console.error('[Twitter] Response:', JSON.stringify(responseData, null, 2));
    }
    return [];
  }
}

// 获取趋势话题
export async function fetchTwitterTrends(): Promise<SourceResult[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/twitter/trends`, {
      headers: {
        'X-API-Key': getApiKey(),
        'Accept': 'application/json'
      },
      params: {
        id: '1' // Worldwide
      },
      timeout: 15000
    });

    const results: SourceResult[] = [];

    if (response.data?.trends) {
      for (const trend of response.data.trends.slice(0, 20)) {
        results.push({
          title: trend.name || '无标题',
          summary: `热度: ${formatNumber(trend.tweetVolume || 0)}`,
          url: trend.url || `https://twitter.com/search?q=${encodeURIComponent(trend.name)}`,
          source: 'twitter',
          heat: trend.tweetVolume || 0,
          timestamp: new Date()
        });
      }
    }

    return results;
  } catch (error) {
    console.error('[Twitter] Failed to fetch trends:', (error as Error).message);
    return [];
  }
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
