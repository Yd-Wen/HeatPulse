export interface Keyword {
  id: number;
  keyword: string;
  category?: string;
  is_active: boolean;
  notify_email?: string;
  created_at: string;
}

export interface Hotspot {
  id: number;
  title: string;
  content?: string;
  source_url: string;
  source_type: 'twitter' | 'bilibili' | 'weibo' | 'baidu' | 'zhihu' | 'sogou' | 'search';
  keyword_id?: number;
  relevance_score: number;
  is_fake: boolean;
  ai_summary?: string;
  ai_tags?: string[];
  importance?: number;
  importance_level?: 'urgent' | 'high' | 'medium' | 'low';
  published_at?: string;
  created_at: string;
  keyword?: Keyword;
}

export type SortField = 'created_at' | 'importance' | 'relevance_score' | 'source_type';

export interface HotspotsQueryParams {
  limit?: number;
  offset?: number;
  keyword_id?: number;
  source_type?: string;
  is_fake?: boolean;
  search?: string;
  start_date?: string;
  end_date?: string;
  /** 多字段排序参数，格式: "field1:asc,field2:desc" */
  sort?: string;
  /** 单字段排序（向后兼容） */
  sort_by?: SortField;
  sort_order?: 'asc' | 'desc';
  importance_level?: 'urgent' | 'high' | 'medium' | 'low';
}

export interface Notification {
  id: number;
  hotspot_id: number;
  type: 'websocket' | 'email';
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  error?: string;
}

export interface Stats {
  total_keywords: number;
  active_keywords: number;
  total_hotspots: number;
  today_hotspots: number;
  real_time_hotspots: number;
}

export interface ScanStatus {
  is_scanning: boolean;
  last_scan?: {
    id: number;
    started_at: string;
    ended_at: string;
    status: string;
    hotspots_found: number;
  };
  next_scan?: string;
}

export interface WSMessage {
  type: 'NEW_HOTSPOT' | 'SCAN_START' | 'SCAN_COMPLETE' | 'PING';
  data?: Hotspot | ScanStatus;
  timestamp: string;
}
