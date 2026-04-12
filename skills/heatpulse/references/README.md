# HeatPulse Agent Skill

AI/技术热点追踪技能 - 支持 Twitter 和 Firecrawl MCP

## 什么是 HeatPulse Skill

HeatPulse Skill 是一个 Claude Code Agent Skill，用于追踪 AI/技术领域的热点、趋势和最新消息。

## 核心特性

- **支持 Twitter API** - 需要配置 TWITTER_API_KEY 环境变量
- **支持 Firecrawl MCP** - 需要 API Key
- **Claude 作为 AI 引擎** - 使用 Claude 自身进行热点分析
- **无持久化** - 按需查询，不存储数据
- **即时回复** - 直接在对话中展示结果

## 安装

将 `skills/heatpulse` 目录复制到你的 Claude Code skills 目录中：

```
~/.claude/skills/heatpulse/
```

## 配置

### Twitter API（推荐）

1. 获取 API Key（访问 twitterapi.io）
2. 在 `settings.json` 中添加：
   ```json
   {
     "env": {
       "TWITTER_API_KEY": "your_api_key_here"
     }
   }
   ```

### Firecrawl MCP（可选）

如需使用 Firecrawl MCP 搜索，需要：
1. 申请 Firecrawl API Key
2. 在 Claude Code 的 MCP 配置中添加：
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

## 使用方式

当你说以下内容时，Skill 会自动触发：

- "帮我看看 AI 领域最近有什么热点"
- "查一下最新的 AI 新闻"
- "有什么 AI 编程的热门话题"
- "监控 XXX 关键词的最新消息"
- "搜索一下最新的大模型技术动态"

## 输出示例

```
## 🔥 AI 领域热点发现

共发现 8 条热点，按热度降序排列：

### 🔥 热点 1 [相关度: 95 | 热度: 88]
**标题**: DeepSeek 发布最新大模型 DeepSeek-R2
**来源**: @deepseek | 2025-04-10
**摘要**: DeepSeek 宣布推出下一代大模型 R2，在代码生成和数学推理方面有重大突破
**标签**: 大模型, DeepSeek, AI进展

[查看原文 →](https://twitter.com/...)
```

## 依赖

- **Twitter API** (可选) - 需要配置 TWITTER_API_KEY 环境变量
- **Firecrawl MCP** (可选) - 需要 API Key

## 文件结构

```
skills/heatpulse/
├── SKILL.md           # Skill 定义文件
├── evals/
│   └── evals.json     # 测试用例
└── README.md          # 本文件
```