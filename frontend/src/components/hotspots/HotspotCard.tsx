import { motion } from 'framer-motion';
import {
  ExternalLink,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { Hotspot } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface HotspotCardProps {
  hotspot: Hotspot;
  index?: number;
}

// 来源标签映射（只保留 label）
const sourceLabels: Record<string, string> = {
  twitter: 'X',
  bilibili: 'B站',
  weibo: '微博',
  baidu: '百度',
  zhihu: '知乎',
  search: '搜索',
  api: 'API',
};

export function HotspotCard({ hotspot, index = 0 }: HotspotCardProps) {
  const relevanceColor =
    hotspot.relevance_score >= 80
      ? 'success'
      : hotspot.relevance_score >= 60
      ? 'warning'
      : 'default';

  const isHighImportance = hotspot.importance && hotspot.importance >= 8;

  // 获取来源标签
  const sourceLabel = sourceLabels[hotspot.source_type] || hotspot.source_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        hover
        glow={isHighImportance ? 'pink' : 'none'}
        className={isHighImportance ? 'border-[#ff3366]/30' : ''}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-[#f0f0f5] leading-tight line-clamp-2">
              {hotspot.title}
            </h3>
            <a
              href={hotspot.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 rounded-lg bg-[#1a1a25] text-[#9ca3af] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* AI Summary */}
          {hotspot.ai_summary && (
            <p className="text-sm text-[#9ca3af] line-clamp-3">
              {hotspot.ai_summary}
            </p>
          )}

          {/* Tags */}
          {hotspot.ai_tags && hotspot.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hotspot.ai_tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#2a2a3a]">
            <div className="flex items-center gap-3">
              {/* Source Type - 只显示 label */}
              <Badge variant="info" size="sm">
                {sourceLabel}
              </Badge>

              {/* Authenticity */}
              {hotspot.is_fake ? (
                <Badge variant="error" size="sm">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  可疑
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  <Shield className="w-3 h-3 mr-1" />
                  可信
                </Badge>
              )}

              {/* Relevance Score */}
              <Badge variant={relevanceColor} size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                {Math.round(hotspot.relevance_score)}分
              </Badge>
            </div>

            {/* Date */}
            <span className="text-xs text-[#6b7280]">
              {new Date(hotspot.created_at).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
