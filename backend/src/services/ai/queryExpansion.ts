import OpenAI from 'openai';
import type { QueryVariants } from '../../types';
import { QUERY_EXPANSION_PROMPT } from './prompts';

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

// 生成查询变体（Query Expansion）
export async function generateQueryVariants(keyword: string): Promise<QueryVariants> {
  const client = createOpenAIClient();
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

  const prompt = QUERY_EXPANSION_PROMPT.replace('{{keyword}}', keyword);

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: '你是一个搜索优化助手。请生成关键词的搜索变体列表。只返回 JSON 格式，不要添加其他文字。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from AI');
      }

      // 尝试解析 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);

      // 限制最多 3 个变体
      const limitedVariants = Array.isArray(result.variants)
        ? result.variants.slice(0, 3)
        : [keyword];

      return {
        variants: limitedVariants,
        reasoning: result.reasoning || ''
      };
    } catch (error: any) {
      lastError = error as Error;
      console.error(`[QueryExpansion] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // 指数退避
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败，返回默认值
  console.error('[QueryExpansion] All retries failed, returning default result');
  return {
    variants: [keyword],
    reasoning: 'AI 生成失败，使用原始关键词'
  };
}
