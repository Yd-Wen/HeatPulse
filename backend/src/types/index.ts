// 关键词
export interface Keyword {
  id: number;
  keyword: string;
  category?: string;
  is_active: boolean;
  notify_email?: string;
  created_at: Date;
}

// 热点
export interface Hotspot {
  id: number;
  title: string;
  content?: string | null;
  source_url: string;
  source_type: string;
  keyword_id?: number | null;
  relevance_score: number;
  is_fake: boolean;
  ai_summary?: string | null;
  ai_tags?: string | string[] | null;
  importance?: number | null;  // 热度值 (0-100)
  language?: string | null;    // 原文语言 (zh/en)
  notification_sent: boolean;  // 系统通知已推送
  email_sent: boolean;         // 邮件已发送
  published_at?: Date | null;
  created_at: Date;
  // 计算字段（前端展示用）
  relevance_level?: 'core' | 'relevant' | 'partial';  // 相关性分级
  heat_level?: 'viral' | 'hot' | 'growing' | 'cold';  // 热度分级
}

// 通知
export interface Notification {
  id: number;
  hotspot_id: number;
  type: 'websocket' | 'email';
  status: 'pending' | 'sent' | 'failed';
  sent_at?: Date;
  error?: string;
}

// 扫描日志
export interface ScanLog {
  id: number;
  started_at: Date;
  ended_at?: Date;
  status: 'running' | 'completed' | 'failed';
  keywords_count?: number;
  hotspots_found?: number;
  error?: string;
}

// 数据源结果
export interface SourceResult {
  title: string;
  summary: string;
  url: string;
  source: string;
  heat: number;
  timestamp: Date;
  isAccount?: boolean;
  accountInfo?: {
    avatar?: string;
    followers?: number;
    description?: string;
  };
}

// AI 分析结果
export interface AIAnalysisResult {
  is_real: boolean;
  relevance_score: number;  // 相关性 (0-100)
  heat_score: number;       // 热度值 (0-100)
  summary: string;
  tags: string[];
  language: 'zh' | 'en';
}

// 查询变体（Query Expansion）
export interface QueryVariants {
  variants: string[];
  reasoning: string;
}

// WebSocket 消息
export interface WSMessage {
  type: 'NEW_HOTSPOT' | 'SCAN_START' | 'SCAN_COMPLETE' | 'PING' | 'PONG';
  data?: any;
  timestamp: string;
}

// 统计数据
export interface Stats {
  total_keywords: number;
  active_keywords: number;
  total_hotspots: number;
  today_hotspots: number;
  real_time_hotspots: number;
  system_notifications: number;  // 系统通知数
  email_notifications: number;   // 邮件通知数
}

// 扫描状态
export interface ScanStatus {
  is_scanning: boolean;
  last_scan?: string;
  next_scan?: string;
}
