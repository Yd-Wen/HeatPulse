# 基于Query Expansion的搜索优化

## 背景

本方案解决以下两个问题：
1. ~~`relevance_score` 被错误赋值为 `authenticity_score` 的问题~~（已解决）
2. 添加 Query Expansion（关键词扩展）提高检索质量和相关性指标
3. ~~优化热度值计算方案~~（不再考虑）

---

## 问题 1：relevance_score 被错误赋值

### 当前状态：已解决

在 `backend/src/services/scanner/index.ts` 中，问题已修复：
```typescript
// 第 188 行：正确赋值相关性分数
relevance_score: analysis.relevance_score,

// 第 192 行：正确赋值热度值
importance: analysis.heat_score,
```

数据库 schema 也已更新，`importance` 字段存储 `heat_score` 而非 `authenticity_score`。

---

## 问题 2：Query Expansion（关键词扩展）

### 背景

当前扫描流程：
1. 用户设置关键词（如 `GPT`）
2. 直接用 `GPT` 在各数据源搜索
3. 获取结果 → AI 分析 → 存储

**问题**：简单关键词匹配无法捕获语义相关的内容。
- 用户输入 `GPT`，但可能遗漏 `OpenAI`、`ChatGPT`、`LLM` 相关内容
- 搜狗只返回包含 `GPT` 文字的结果

### 解决方案：Query Expansion

**流程改进**：
```
用户输入关键词 → AI 生成查询变体列表 → 用所有变体并行搜索 → 合并去重结果 → AI 分析相关性
```

例如：
- 用户输入：`GPT`
- AI 生成变体：`[GPT, OpenAI, ChatGPT, LLM, 大语言模型, GPT-4, GPT-3.5]`

### 技术方案

#### 2.1 新增 AI Prompt：生成查询变体

**文件**: `backend/src/services/ai/prompts.ts`

```typescript
// Query Expansion Prompt
export const QUERY_EXPANSION_PROMPT = `请为以下关键词生成搜索变体列表，用于多数据源并行搜索：

关键词：{{keyword}}

请生成 5-8 个相关的搜索变体，包括：
- 原始关键词
- 英文缩写/全称
- 中文翻译/描述
- 相关术语

请以 JSON 数组格式返回，不要包含其他任何文字：
{
  "variants": string[],
  "reasoning": string
}`;
```

#### 2.2 新增服务：查询变体生成

**文件**: `backend/src/services/ai/queryExpansion.ts`

```typescript
import { createOpenAIClient } from './openrouter';
import type { QueryVariants } from '../../types';
import { QUERY_EXPANSION_PROMPT } from './prompts';

export async function generateQueryVariants(keyword: string): Promise<QueryVariants> {
  const client = createOpenAIClient();
  const prompt = QUERY_EXPANSION_PROMPT.replace('{{keyword}}', keyword);

  const completion = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
    messages: [
      {
        role: 'system',
        content: '你是一个搜索优化助手。请生成关键词的搜索变体列表。'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 500,
  });

  const response = completion.choices[0]?.message?.content;
  const jsonMatch = response?.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch?.[0] || '{}');

  return {
    variants: Array.isArray(result.variants) ? result.variants : [keyword],
    reasoning: result.reasoning || ''
  };
}
```

#### 2.3 新增类型定义

**文件**: `backend/src/types/index.ts`

```typescript
// 查询变体
export interface QueryVariants {
  variants: string[];
  reasoning: string;
}
```

#### 2.4 Scanner 服务集成

**文件**: `backend/src/services/scanner/index.ts`

```typescript
import { generateQueryVariants } from '../ai/queryExpansion';

// 在 startScan 函数中
async function startScan(keywordIds?: number[], sources?: string[]) {
  // ... 现有代码 ...

  // 获取关键词
  const keywords = await prisma.keyword.findMany({
    where: {
      is_active: true,
      ...(keywordIds && keywordIds.length > 0 && { id: { in: keywordIds } })
    }
  });

  // 对每个关键词生成查询变体
  const keywordWithVariants = await Promise.all(
    keywords.map(async (keyword) => {
      const variants = await generateQueryVariants(keyword.keyword);
      return {
        ...keyword,
        variants: variants.variants
      };
    })
  );

  // 提取所有变体用于搜索
  const allVariants = keywordWithVariants.flatMap(k => k.variants);

  // 使用所有变体并行获取数据（去重）
  const sourceResults = await fetchAllSources(allVariants, sources);
}
```

#### 2.5 关键词匹配逻辑优化

**文件**: `backend/src/services/scanner/index.ts`

```typescript
// 找到匹配的关键词（使用原始关键词匹配，不是变体）
// 变体仅用于搜索数据源，但热点关联的是原始关键词
const matchedKeyword = keywords.find(k =>
  result.title.toLowerCase().includes(k.keyword.toLowerCase()) ||
  result.summary.toLowerCase().includes(k.keyword.toLowerCase())
);

// 保存热点时，关联的是原始关键词的 ID
keyword_id: matchedKeyword?.id || null,
```

#### 2.6 用户搜索时的 Query Expansion

当用户在热点列表页搜索时，同样可以应用 Query Expansion：

```typescript
// backend/src/routes/hotspots.ts

router.get('/', async (req, res) => {
  const { search } = req.query;

  // 如果有搜索关键词，先生成变体
  let searchVariants = [search as string];
  if (search && (search as string).length >= 2) {
    try {
      const variants = await generateQueryVariants(search as string);
      searchVariants = variants.variants;
    } catch (e) {
      // 如果失败，回退到原始关键词
      console.error('Query expansion failed:', e);
    }
  }

  // 使用变体进行 OR 查询
  where.OR = searchVariants.map(variant => [
    { title: { contains: variant } },
    { content: { contains: variant } },
    { ai_summary: { contains: variant } }
  ]).flat();
});
```

---

## 完整流程（最终方案）

```
1. 获取活跃关键词列表
2. 对每个关键词：
   2.1 调用 AI 生成查询变体列表（Query Expansion）
   2.2 使用所有变体并行搜索各数据源
   2.3 合并去重结果
3. 对每个结果：
   3.1 调用 AI 分析
       - 评估 relevance_score（相关性，0-100）
       - 评估 heat_score（热度值，0-100）
   3.2 如果 relevance_score < 40，跳过
   3.3 找到匹配的原始关键词
   3.4 保存热点（关联关键词、相关性分数、热度值、语言）
   3.5 如果 heat_score >= 70，发送邮件通知
4. 广播新热点
```

---

## 关键文件清单

| 阶段 | 文件 | 操作 |
|------|------|------|
| 1 | `backend/src/services/ai/prompts.ts` | 新增 QUERY_EXPANSION_PROMPT |
| 2 | `backend/src/services/ai/queryExpansion.ts` | 新增文件，生成查询变体 |
| 3 | `backend/src/types/index.ts` | 新增 QueryVariants 接口 |
| 4 | `backend/src/services/scanner/index.ts` | 集成 Query Expansion |
| 5 | `backend/src/routes/hotspots.ts` | 用户搜索时使用 Query Expansion |
| 6 | `frontend/src/types/index.ts` | 更新类型定义（如需要） |

---

## 指标定义

### 相关性（relevance_score）

| 分值范围 | 标签 | 说明 |
|----------|------|------|
| 80-100 | 直击核心 | 内容高度相关，是核心技术或重大进展 |
| 60-79 | 高度贴合 | 内容相关，对技术从业者有参考价值 |
| 40-59 | 轻度关联 | 内容有一定关联，但非核心热点 |
| < 40 | 不保存 | 与关键词关系不大 |

### 热度值（heat_score）

| 分值范围 | 标签 | 说明 |
|----------|------|------|
| 90-100 | 刷屏级 | 重大突破、引发全行业讨论 |
| 70-89 | 热议中 | 热门话题，预计大量转发 |
| 40-69 | 持续发酵 | 中等热度，持续传播 |
| 0-39 | 无人问津 | 较低热度，传播有限 |
