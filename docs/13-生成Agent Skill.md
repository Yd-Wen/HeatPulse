# HeatPulse Agent Skill 创建计划

## 背景

用户希望将 HeatPulse 热点监控工具封装为 Claude Code 的 Agent Skill。根据需求文档和技术方案，需要创建一个独立于后端项目的 Skill，完全自包含。

## 核心要求

1. 使用 Skill Creator 技能来创建
2. 不依赖后端 server，直接调用外部 API（搜索引擎、Twitter API、OpenRouter）
3. Claude 自身就是 AI 分析引擎，不需要额外调用 OpenRouter
4. 安装本技能后不需要 API key 也能使用（仅 Twitter API 可选）
5. 无持久化存储，按需查询
6. 无 websocket + 邮箱通知，由 claude 直接回复

## 实现方案

### 1. Skill 目录结构

```
HeatPulse/skills/heatpulse/
├── SKILL.md                    # Skill 定义文件（必需）
├── scripts/
│   ├── search.ts               # 搜索服务（使用 Firecrawl MCP）
│   ├── twitter.ts              # Twitter 数据源（可选）
│   └── analyzer.ts             # Claude AI 分析逻辑
├── references/
│   └── prompts.md               # 分析用的 prompt 模板
└── evals/
    └── evals.json              # 测试用例
```

### 2. 核心技术实现

**搜索方式**：使用 Firecrawl MCP 的 `firecrawl_search` 功能
- 无需 API key
- 支持网页搜索

**Twitter 数据源**（可选）：
- 使用 twitterapi.io（用户已有 API key）
- 如未配置则跳过

**AI 分析**：直接使用 Claude 本身
- 判断内容真实性
- 评估相关性 (0-100)
- 评估热度值 (0-100)
- 生成摘要和标签

### 3. SKILL.md 核心内容

```yaml
---
name: heatpulse
description: 当用户想要追踪AI/技术领域的热点、趋势、最新消息，或者想要监控特定关键词的最新动态时触发此技能
---
```

### 4. 技能功能

- **热点发现**：搜索最新 AI/技术热点
- **关键词监控**：按用户指定的关键词搜索最新内容
- **多源聚合**：合并搜索结果并去重
- **AI 分析**：Claude 直接分析内容相关性、热度、真实性
- **即时回复**：直接向用户展示分析结果

## 关键文件

- `skills/heatpulse/SKILL.md` - Skill 定义
- `skills/heatpulse/scripts/search.ts` - 搜索逻辑
- `skills/heatpulse/scripts/analyzer.ts` - 分析逻辑

## 验证方式

1. 创建完成后，用户可以说"帮我看看 AI 领域最近有什么热点"
2. Skill 应能返回热点列表，包含标题、来源、相关性评分、热度评分、AI 摘要
