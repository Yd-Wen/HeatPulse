import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceResult } from '../../../types';
import { getRandomUserAgent, randomDelay } from './index';

const SOGOU_BASE_URL = 'https://www.sogou.com/web';

/**
 * 搜索搜狗（支持中英文）
 * @param keyword 搜索关键词
 * @param limit 返回结果数量
 */
export async function searchSogou(keyword: string, limit: number = 10): Promise<SourceResult[]> {
  try {
    // 添加随机延迟避免被封
    await randomDelay(2000, 4000);

    const response = await axios.get(SOGOU_BASE_URL, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.sogou.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'max-age=0',
      },
      params: {
        query: keyword,
        ie: 'utf8',
        _ast: Date.now(), // 添加时间戳避免缓存
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const results: SourceResult[] = [];
    const html = response.data;

    // 使用 cheerio 解析 HTML
    const $ = cheerio.load(html);

    // 解析搜索结果
    // 搜狗搜索结果通常在 .results .vrwrap 或 .results .result 中
    $('.results .vrwrap, .results .result').each((index, element) => {
      if (results.length >= limit) return false;

      const $el = $(element);

      // 提取标题
      const titleEl = $el.find('h3 a, .vr-title a, a[href^="/link?"]').first();
      const title = titleEl.text().trim();

      // 提取 URL
      let url = titleEl.attr('href') || '';
      // 处理搜狗重定向链接 - 需要拼接完整 URL 让前端点击后跳转
      if (url.startsWith('/link?') || url.startsWith('/link')) {
        url = `https://www.sogou.com${url}`;
      }

      // 提取摘要
      const summary = $el.find('.str-text, .vr-text, .abstract, .content-right_8Zs40').text().trim();

      // 提取来源/时间信息
      const sourceText = $el.find('.citeurl, .g, .fz-mid').text().trim();

      if (title && url) {
        results.push({
          title: title.replace(/<[^>]+>/g, ''), // 去除 HTML 标签
          summary: summary || sourceText || '搜狗搜索结果',
          url: url,
          source: 'sogou',
          heat: 0, // 搜狗没有公开的热度数据
          timestamp: new Date(),
        });
      }
    });

    // 如果没有找到结果，尝试备用选择器
    if (results.length === 0) {
      $('.result, .rb').each((index, element) => {
        if (results.length >= limit) return false;

        const $el = $(element);
        const titleEl = $el.find('h3 a').first();
        const title = titleEl.text().trim();
        let url = titleEl.attr('href') || '';

        if (url.startsWith('/link?') || url.startsWith('/link')) {
          url = `https://www.sogou.com${url}`;
        }

        const summary = $el.find('.content_3Vjst, .abstract, .str-text').text().trim();

        if (title && url) {
          results.push({
            title: title.replace(/<[^>]+>/g, ''),
            summary: summary || '搜狗搜索结果',
            url: url,
            source: 'sogou',
            heat: 0,
            timestamp: new Date(),
          });
        }
      });
    }

    console.log(`[Sogou] Found ${results.length} results for "${keyword}"`);
    return results;
  } catch (error: any) {
    const statusCode = error?.response?.status;
    console.error(`[Sogou] Failed to search [${statusCode}]:`, (error as Error).message);
    return [];
  }
}

/**
 * 获取搜狗热搜榜
 */
export async function fetchSogouHotSearch(): Promise<SourceResult[]> {
  try {
    await randomDelay(1000, 2000);

    const response = await axios.get('https://www.sogou.com/', {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 10000,
    });

    const results: SourceResult[] = [];
    const html = response.data;
    const $ = cheerio.load(html);

    // 尝试解析热搜（如果页面中有）
    $('.hot-news a, .top-news a, [data-index]').each((index, element) => {
      if (results.length >= 20) return false;

      const $el = $(element);
      const title = $el.text().trim();
      const url = $el.attr('href') || '';

      if (title && url) {
        results.push({
          title,
          summary: '搜狗热搜',
          url: url.startsWith('http') ? url : `https://www.sogou.com${url}`,
          source: 'sogou',
          heat: 0,
          timestamp: new Date(),
        });
      }
    });

    return results;
  } catch (error) {
    console.error('[Sogou] Failed to fetch hot search:', (error as Error).message);
    return [];
  }
}
