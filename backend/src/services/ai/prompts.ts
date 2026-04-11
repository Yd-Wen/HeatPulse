// 热点分析 Prompt 模板
export const HOTSPOT_ANALYSIS_PROMPT = `请分析以下内容，判断其是否为真实的 AI/技术相关热点：

标题：{{title}}
内容：{{content}}
来源：{{source}}

请从以下几个方面进行分析：

1. **真实性判断**：这是否是真实的技术/AI 领域热点？（请基于内容质量、来源可信度、信息完整性判断）
2. **真实度评分**：0-100 分，评估内容的真实可信度
3. **虚假原因**：如果判断为虚假或不可信，请说明原因；如果是真实的，填 null
4. **内容摘要**：用 50-100 字总结核心内容
5. **相关标签**：提取 3-5 个相关技术/领域标签（如 "AI", "大模型", "编程", "Python" 等），以 JSON 数组格式返回
6. **重要性评分**：1-10 分，评估对技术从业者的价值

请以以下 JSON 格式返回，不要包含其他任何文字：
{
  "is_real": boolean,
  "authenticity_score": number,
  "fake_reason": string | null,
  "summary": string,
  "tags": string[],
  "importance": number
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
