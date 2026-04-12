import OpenAI from 'openai';
import type { AIAnalysisResult } from '../../types';
import { HOTSPOT_ANALYSIS_PROMPT } from './prompts';

// 初始化 OpenAI 客户端（使用 OpenRouter）
function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://heatpulse.local',
      'X-OpenRouter-Title': 'HeatPulse',
    },
  });
}

// AI 分析内容
export async function analyzeContent(
  title: string,
  content: string,
  source: string
): Promise<AIAnalysisResult> {
  const client = createOpenAIClient();
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

  const prompt = HOTSPOT_ANALYSIS_PROMPT
    .replace('{{title}}', title)
    .replace('{{content}}', content)
    .replace('{{source}}', source);

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的新闻真实性分析助手。请分析内容的真实性、重要性和相关性。只返回 JSON 格式，不要添加其他文字。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from AI');
      }

      // 尝试解析 JSON
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const result = JSON.parse(jsonMatch[0]);

        // 验证返回格式
        return {
          is_real: Boolean(result.is_real),
          relevance_score: Math.max(0, Math.min(100, Math.round(result.relevance_score || 50))),
          heat_score: Math.max(0, Math.min(100, Math.round(result.heat_score || 50))),
          summary: result.summary || '暂无摘要',
          tags: Array.isArray(result.tags) ? result.tags : [],
          language: result.language === 'zh' || result.language === 'en' ? result.language : 'zh'
        };
      } catch (parseError) {
        console.error('[AI] Failed to parse response:', response);
        throw new Error(`Failed to parse AI response: ${(parseError as Error).message}`);
      }
    } catch (error: any) {
      lastError = error as Error;
      const statusCode = error?.response?.status || 'unknown';
      const errorDetail = error?.response?.data?.error?.message || error?.response?.data?.message || '';
      console.error(`[AI] Attempt ${attempt} failed [${statusCode}]:`, lastError.message, errorDetail);

      if (attempt < maxRetries) {
        // 指数退避
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败，返回默认值
  console.error('[AI] All retries failed, returning default result');
  return {
    is_real: true,
    relevance_score: 50,
    heat_score: 50,
    summary: 'AI 分析失败，请手动验证',
    tags: [],
    language: 'zh'
  };
}

// 批量分析（用于测试）
export async function analyzeBatch(items: Array<{ title: string; content: string; source: string }>): Promise<AIAnalysisResult[]> {
  const results: AIAnalysisResult[] = [];

  for (const item of items) {
    const result = await analyzeContent(item.title, item.content, item.source);
    results.push(result);
    // 避免触发速率限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}
