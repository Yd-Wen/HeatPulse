---
name: heatpulse
description: 当用户想要追踪AI/技术/编程领域的热点、趋势、最新消息，或者想要监控特定关键词的最新动态时触发此技能。包括但不限于：用户说"帮我看看AI领域最近有什么热点"、"查一下最新的AI新闻"、"有什么AI编程的热门话题"、"监控XXX关键词的最新消息"等场景。此技能会自动搜索多个数据源，用Claude自身进行AI分析，并直接向用户展示热点分析结果。
---

# HeatPulse Agent Skill

AI/技术热点追踪技能 - 支持 Twitter 和 Firecrawl MCP

## 功能概述

本技能提供以下功能：
1. **热点发现** - 搜索最新 AI/技术/编程领域的热点
2. **关键词监控** - 按用户指定的关键词搜索最新内容
3. **多源聚合** - 合并多个搜索结果并去重
4. **AI 分析** - Claude 直接分析内容相关性、热度、真实性
5. **即时回复** - 直接向对话展示热点分析结果

## 核心特性

- **可选 Firecrawl MCP** - 需要 API Key，配置后可用
- **可选 Twitter API** - 需要配置 TWITTER_API_KEY 环境变量
- **Claude 作为 AI 引擎** - 使用 Claude 自身进行分析
- **无持久化** - 按需查询，不存储数据

## 使用流程

### 步骤 1：理解用户需求

用户可能说：
- "帮我看看 AI 领域最近有什么热点"
- "查一下最新的 AI 新闻"
- "有什么 AI 编程的热门话题"
- "监控 deepseek 关键词的最新消息"
- "帮我搜索一下 Claude 4 的最新动态"

从用户输入中提取：
1. **搜索主题** - 用户想了解什么领域（如：AI、大模型、编程）
2. **关键词** - 用户指定的具体监控词（如：deepseek、Claude 4）
3. **是否需要持续监控** - 一次性还是定期

### 步骤 2：执行搜索

#### 方式 A：Twitter API（推荐，已配置时）

使用 twitterapi.io 进行搜索：
- API 端点: `https://api.twitterapi.io/twitter/tweet/advanced_search`
- 请求方式: **GET**（不是 POST）
- 请求头: `x-api-key: {TWITTER_API_KEY}`（注意是 x-api-key，不是 Authorization）
- 参数: `query=` 和 `limit=`

```bash
curl -s "https://api.twitterapi.io/twitter/tweet/advanced_search?query=AI%20LLM&limit=15" -H "x-api-key: $TWITTER_API_KEY"
```

示例搜索查询：
- "AI LLM 大模型"
- "DeepSeek OpenAI Anthropic"
- "GPT-5 Claude 4"
- "AI Agent 工作流"

#### 方式 B：Firecrawl MCP（需要 API Key）

```
搜索命令: firecrawl_search
参数:
- query: 用户想要的搜索主题
- limit: 10-20 条结果
```

**注意**: Firecrawl MCP 需要 API Key，配置方式：
```json
{
  "mcpServers": {
    "mcp-server-firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### 步骤 3：Claude AI 分析

对每条搜索结果，使用 Claude 自身进行分析：

```
分析内容包括：
1. 相关性评估 (0-100)
   - 与用户搜索主题的相关程度
   - core: >=80, relevant: 60-79, partial: <60

2. 热度评估 (0-100)
   - 基于内容的新鲜度、互动数据、来源权威性
   - viral: >=90, hot: 70-89, growing: 40-69, cold: <40

3. 真实性判断
   - 是否为可靠的新闻来源
   - 是否有具体数据/来源支撑

4. 内容摘要
   - 用一句话总结内容要点

5. 标签生成
   - 生成相关的标签数组
```

### 步骤 4：展示结果

按热度降序排列，用卡片形式展示：

```
## 🔥 AI 领域热点

共发现 {N} 条热点，按热度降序排列：

### 🔥 热点 1 [相关度: {score} | 热度: {heat}]
**标题**: {title}
**来源**: @{author} | {date}
**摘要**: {summary}
**标签**: {tags}

[查看原文 →](url)

---
```

## Twitter API 配置

### 环境变量配置

在 `settings.json` 中添加：
```json
{
  "env": {
    "TWITTER_API_KEY": "your_api_key_here"
  }
}
```

### API 使用注意事项

1. **请求头格式**: 使用 `x-api-key` 而不是 `Authorization: Bearer`
2. **请求方法**: 使用 GET 而不是 POST
3. **参数传递**: 查询参数用 URL 编码，如 `query=AI%20LLM`

### 无配置时的处理

如果未配置 TWITTER_API_KEY：
1. 告知用户需要配置 Twitter API Key
2. 引导用户在 settings.json 中添加配置
3. 跳过 Twitter 数据源

## 输出格式

### 热点列表格式

```markdown
## 🔥 {主题} 热点发现

共发现 {N} 条热点，按热度降序排列：

### 🔥 热点 1 [相关度: {score} | 热度: {heat}]
**标题**: {title}
**来源**: @{author} | {date}
**摘要**: {summary}
**标签**: {tags}

[查看原文 →](url)

---

### 🔥 热点 2 [相关度: {score} | 热度: {heat}]
**标题**: {title}
...
```

### 无结果情况

如果搜索不到结果：
```
🔍 搜索"{keyword}"未发现相关热点

建议：
1. 尝试扩大搜索范围
2. 更换搜索关键词
3. 确认 Twitter API Key 已正确配置
```

### 无 API Key 配置时

```
⚠️ 未检测到 Twitter API Key

当前无法使用 Twitter 数据源。请按以下步骤配置：

1. 获取 Twitter API Key（访问 twitterapi.io）
2. 在 settings.json 中添加：
   "env": {
     "TWITTER_API_KEY": "your_key_here"
   }
3. 重新启动 Claude Code
```

## 错误处理

- **API 认证失败**: 检查 TWITTER_API_KEY 是否正确，header 是否用 x-api-key
- **搜索失败**: 告诉用户搜索服务暂时不可用，建议稍后重试
- **结果为空**: 说明未找到相关内容，提供搜索建议
- **网络超时**: 重试一次，如果仍然失败，告知用户
- **方法不允许**: 确认使用 GET 而不是 POST 请求

## 注意事项

1. **不要调用 OpenRouter** - 使用 Claude 自身进行分析
2. **请求头格式** - Twitter API 必须用 `x-api-key` 不是 Authorization
3. **请求方法** - Twitter API 必须用 GET 不是 POST
4. **不要存储数据** - 每次都是新鲜查询
5. **不要发送邮件/WebSocket** - 直接在对话中回复
6. **Firecrawl 需要 API Key** - 不是免费的，需要申请 API Key