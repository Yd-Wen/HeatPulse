# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本项目中工作时提供指导。

## 项目概述

HeatPulse 是一个 AI 驱动的热点/趋势追踪系统，用于监控多个数据源中的关键词并向用户推送热点内容。使用 React + Express + Prisma + SQLite 构建。

## 常用命令

### 后端
```bash
cd backend
npm run dev          # 启动开发服务器 (端口 3001)
npm run build        # 编译 TypeScript
npm start            # 运行编译后的服务器
npm run db:generate  # 生成 Prisma 客户端
npm run db:migrate   # 执行数据库迁移
npm run db:studio    # 打开 Prisma Studio
```

### 前端
```bash
cd frontend
npm run dev          # 启动 Vite 开发服务器 (端口 5173)
npm run build        # 构建生产版本
npm run lint         # 运行 ESLint
npm run preview      # 预览生产构建
```

## 架构

### 后端 (Express + Prisma + SQLite)
- `src/routes/` - REST API 端点 (hotspots, keywords, scan, stats)
- `src/services/scanner/` - 数据源扫描器 (BiliBili, Sogou, Twitter)
- `src/services/ai/` - OpenRouter AI 集成，用于内容分析
- `src/services/email.ts` - SMTP 邮件通知
- `src/jobs/scanCron.ts` - 通过 node-cron 定期扫描
- 端口 3002 上的 WebSocket 服务器，用于实时推送前端更新

### 前端 (React + Vite + Tailwind)
- `src/pages/` - Dashboard、Keywords、Hotspots 页面
- `src/components/hotspots/` - HotspotCard、HotspotList（含筛选/排序）
- `src/components/keywords/` - 关键词管理 UI
- WebSocket 客户端用于实时更新

### 数据库
- SQLite 数据库位于 `backend/prisma/data/heatpulse.db`
- Prisma schema 定义了：Keyword、Hotspot、Notification、ScanLog 模型
## 关键依赖

- **AI**: OpenRouter (deepseek/deepseek-chat)
- **搜索**: Twitter API (twitterapi.io)、Bilibili、Sogou 搜索
- **实时**: WebSocket (ws)
- **定时任务**: node-cron
- **邮件**: nodemailer

## 环境变量

将 `.env.example` 复制到后端目录为 `.env`。关键变量：
- `DATABASE_URL` - SQLite 路径
- `OPENROUTER_API_KEY` - AI 服务
- `TWITTER_API_KEY` - Twitter 数据源
- `SMTP_*` - 邮件配置
- `WS_PORT` - WebSocket 服务器端口
- `SCAN_INTERVAL_MINUTES` - 扫描频率
