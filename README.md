# HeatPulse

> AI 驱动的热点/趋势追踪系统

HeatPulse 是一个智能化的热点追踪平台，能够自动监控多个数据源中的关键词，并通过 AI 技术分析内容相关性、生成摘要，帮助用户第一时间发现和跟踪感兴趣的热点话题。

## 技术栈

### 后端

- **框架**: Express + TypeScript
- **数据库**: Prisma + SQLite
- **AI 分析**: OpenRouter (deepseek/deepseek-chat)
- **实时推送**: WebSocket (ws)
- **定时任务**: node-cron
- **邮件通知**: nodemailer

### 前端

- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS 4
- **动画**: Framer Motion
- **路由**: React Router
- **布局**: react-masonry-css

## 项目结构

```
HeatPulse/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # 数据库模型定义
│   └── src/
│       ├── routes/            # REST API 端点
│       │   ├── hotspots.ts    # 热点管理
│       │   ├── keywords.ts   # 关键词管理
│       │   ├── scan.ts        # 扫描触发
│       │   └── stats.ts       # 统计数据
│       ├── services/
│       │   ├── ai/            # AI 分析服务
│       │   │   ├── openrouter.ts
│       │   │   ├── prompts.ts
│       │   │   └── queryExpansion.ts
│       │   ├── scanner/       # 数据源扫描
│       │   │   ├── sources/
│       │   │   │   ├── bilibili.ts
│       │   │   │   ├── sogou.ts
│       │   │   │   └── twitter.ts
│       │   │   └── index.ts
│       │   ├── websocket.ts   # WebSocket 实时推送
│       │   └── email.ts       # 邮件通知
│       ├── jobs/
│       │   └── scanCron.ts    # 定时扫描任务
│       ├── types/
│       │   └── index.ts
│       ├── app.ts
│       ├── server.ts
│       └── utils/
│           └── prisma.ts
└── frontend/
    └── src/
        ├── api/
        │   └── client.ts      # API 客户端
        ├── components/
        │   ├── common/        # 通用组件
        │   │   ├── Button.tsx
        │   │   ├── Card.tsx
        │   │   ├── Input.tsx
        │   │   ├── Modal.tsx
        │   │   └── ...
        │   ├── hotspots/       # 热点相关组件
        │   │   ├── HotspotCard.tsx
        │   │   └── HotspotList.tsx
        │   ├── keywords/      # 关键词相关组件
        │   │   └── KeywordCard.tsx
        │   └── layout/        # 布局组件
        │       └── Layout.tsx
        ├── contexts/
        │   └── WebSocketContext.tsx
        ├── hooks/
        │   └── useWebSocket.ts
        ├── pages/
        │   ├── Dashboard.tsx  # 仪表盘
        │   ├── Hotspots.tsx   # 热点列表
        │   └── Keywords.tsx   # 关键词管理
        ├── types/
        │   └── index.ts
        ├── utils/
        │   └── date.ts
        ├── App.tsx
        └── main.tsx
```

## 功能特性

### 核心功能

- **多数据源监控**: 支持搜狗、B站、X (Twitter) 三大数据源
- **关键词管理**: 添加、删除、启用/禁用关键词，支持分类管理
- **AI 内容分析**: 自动分析内容相关性、热度评分、生成摘要和标签
- **Query Expansion**: 智能扩展搜索词，提升搜索覆盖率
- **实时推送**: WebSocket 实时推送新发现的热点
- **邮件通知**: 热点达到一定热度时自动发送邮件通知
- **定时扫描**: 支持配置定时自动扫描任务

### 热点管理

- 多维度筛选（关键词、来源、相关性、热度、时间范围）
- 多字段排序（发布时间、热度、相关性）
- 批量删除
- 搜索功能（支持 Query Expansion）

### 前端特性

- 现代化暗色主题 UI
- 响应式设计
- 流畅的动画效果
- 实时连接状态指示

## 快速开始

### 前置要求

- Node.js 18+
- npm 9+

### 安装

```bash
# 克隆项目
git clone https://github.com/Yd-Wen/HeatPulse.git
cd HeatPulse

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置

1. 复制环境变量模板：

```bash
cd backend
cp .env.example .env
```

2. 编辑 `.env` 文件，配置必要参数：

```env
# 数据库
DATABASE_URL="file:./prisma/data/heatpulse.db"

# AI 服务 (从 https://openrouter.ai 获取)
OPENROUTER_API_KEY="your-api-key"

# Twitter API (可选)
TWITTER_API_KEY="your-twitter-api-key"

# 邮件配置 (可选)
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
NOTIFY_EMAIL=smtp.example.com

# WebSocket 端口
WS_PORT=3002

# 扫描间隔（分钟）
SCAN_INTERVAL_MINUTES=30
```

### 启动

```bash
# 启动后端 (端口 3001)
cd backend
npm run dev

# 启动前端 (端口 5173)
cd frontend
npm run dev
```

访问 http://localhost:5173 即可使用。

## API 文档

### 热点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hotspots` | 获取热点列表（支持分页、筛选、排序） |
| GET | `/api/hotspots/:id` | 获取热点详情 |
| DELETE | `/api/hotspots/:id` | 删除热点 |

### 关键词

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/keywords` | 获取关键词列表 |
| POST | `/api/keywords` | 创建关键词 |
| PUT | `/api/keywords/:id` | 更新关键词 |
| DELETE | `/api/keywords/:id` | 删除关键词 |

### 扫描

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/scan/trigger` | 触发扫描 |
| GET | `/api/scan/status` | 获取扫描状态 |

### 统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取统计数据 |

## 开发指南

### 数据库操作

```bash
# 生成 Prisma 客户端
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 打开 Prisma Studio
npm run db:studio
```

### 构建

```bash
# 后端构建
cd backend
npm run build

# 前端构建
cd frontend
npm run build
```

## 开源协议

本项目基于 [MIT](LICENSE) License 开源。

Copyright (C) 2026 - present by Yd Wen

## 作者

- **Yd Wen**
  - [GitHub](https://github.com/Yd-Wen)
  - [Gitee](https://gitee.com/yindong-wen)
  - [个人主页](https://yindongwen.top)

## 致谢

- [AI 热点监控工具](https://github.com/liyupi/yupi-hot-monitor) - 编程导航 AI 编程实战项目
- [OpenRouter](https://openrouter.ai) - 提供 AI 推理服务
- [DeepSeek](https://deepseek.com) - 提供高性能 AI 模型
- [Tailwind CSS](https://tailwindcss.com) - CSS 框架
- [Framer Motion](https://www.framer.com/motion/) - React 动画库

## 更新日志

### 2026-04-13
- 🎉 **新增**: 新增热点批量删除功能
- 🎉 **新增**: 新增热点筛选与排序功能
- 🎉 **新增**: 新增相关性分级（直击核心/高度贴合/轻度关联）
- 🎉 **新增**: 新增热度分级（刷屏级/热议中/持续发酵/无人问津）
- ✨ **优化**: 优化热点卡片 UI

### 2026-04-12
- 🎉 **新增**: 新增前端UI优化
- ✨ **优化**: 改进界面风格和布局

### 2026-04-11
- 🐛 **修复**: 修复 p-limit 依赖路径错误

### 2026-04-10
- 🎉 **新增**: 新增生成 Agent Skill 功能
- 🎉 **新增**: 新增热点页面功能增强

### 2026-04-09
- 🎉 **新增**: 新增 Query Expansion 并行扫描
- ✨ **优化**: 优化搜索覆盖率

### 2026-04-08
- 🎉 **新增**: 新增基于 Query Expansion 的搜索优化

### 2026-04-07
- ✨ **优化**: 新增 CLAUDE.md 项目文档

### 2026-03-22
- 🎉 **新增**: 初始项目框架搭建完成
- 🎉 **新增**: 后端服务开发
- 🎉 **新增**: 前端界面开发

---

<p align="center">
  <sub>Built with ❤️ by HeatPulse</sub>
</p>
