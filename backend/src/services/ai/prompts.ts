// 热点分析 Prompt 模板
export const HOTSPOT_ANALYSIS_PROMPT = `请分析以下内容，判断其是否为有价值的 AI/技术热点：

标题：{{title}}
内容：{{content}}
来源：{{source}}

请从以下几个方面进行分析：

1. **相关性评估**：该内容与 AI/技术领域热点的匹配程度（0-100 分）
   - 80-100：直击核心 - 内容高度相关，是核心技术或重大进展
   - 60-80：高度贴合 - 内容相关，对技术从业者有参考价值
   - 40-60：轻度关联 - 内容有一定关联，但非核心热点
   - <40：不相关 - 与 AI/技术领域关系不大
2. **热度值评估**：基于内容的传播潜力评估（0-100 分）
   - 90-100：刷屏级 - 重大突破、引发全行业讨论的内容
   - 70-90：热议中 - 热门话题，预计会有大量转发讨论
   - 40-70：持续发酵 - 中等热度，会在一段时间内持续传播
   - 0-40：无人问津 - 较低热度，传播范围有限
3. **真实性判断**：这是否是真实的技术内容？
4. **内容摘要**：用 50-100 字总结核心内容
5. **相关标签**：提取 3-5 个相关技术/领域标签，以 JSON 数组格式返回
6. **原文语言**：判断内容主体语言
   - 中文内容主体：返回 "zh"
   - 英文内容主体：返回 "en"

请以以下 JSON 格式返回，不要包含其他任何文字：
{
  "is_real": boolean,
  "relevance_score": number,    // 相关性 (0-100)
  "heat_score": number,         // 热度值 (0-100)
  "summary": string,
  "tags": string[],
  "language": "zh" | "en"
}`;

// 热点排序和筛选 Prompt
export const HOTSPOT_RANKING_PROMPT = `请分析以下热点列表，按重要性和热度进行排序：

{{hotspots}}

请返回排序后的列表（保持原有格式，只返回 id 数组）：
{
  "ranked_ids": number[],
  "reasoning": string
}`;

// 趋势分析 Prompt
export const TREND_ANALYSIS_PROMPT = `请分析以下关键词相关的趋势：

关键词：{{keyword}}
相关热点：
{{hotspots}}

请分析：
1. 这是新兴趋势还是已有趋势的延续？
2. 预计热度会持续多久？
3. 建议的跟进策略

以 JSON 格式返回：
{
  "trend_type": "emerging" | "continuing" | "declining",
  "duration_prediction": string,
  "recommendation": string
}`;
