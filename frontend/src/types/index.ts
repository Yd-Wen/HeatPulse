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
  source_type: 'search' | 'twitter' | 'api';
  keyword_id?: number;
  relevance_score: number;
  is_fake: boolean;
  ai_summary?: string;
  ai_tags?: string[];
  importance?: number;
  published_at?: string;
  created_at: string;
  keyword?: Keyword;
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
  last_scan?: string;
  next_scan?: string;
}

export interface WSMessage {
  type: 'NEW_HOTSPOT' | 'SCAN_START' | 'SCAN_COMPLETE' | 'PING';
  data?: Hotspot | ScanStatus;
  timestamp: string;
}
