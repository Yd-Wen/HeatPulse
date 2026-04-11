import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Hotspot } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/Modal';
import { hotspotsApi } from '../../api/client';
import { formatRelativeTime } from '../../utils/date';

interface HotspotCardProps {
  hotspot: Hotspot;
  index?: number;
  onDelete?: () => void;
  showDelete?: boolean;
}

// 来源标签映射（只保留 label）
const sourceLabels: Record<string, string> = {
  twitter: 'X',
  bilibili: 'B站',
  weibo: '微博',
  baidu: '百度',
  zhihu: '知乎',
  sogou: '搜狗',
  search: '搜索',
  api: 'API',
};

export function HotspotCard({ hotspot, index = 0, onDelete, showDelete = false }: HotspotCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const relevanceColor =
    hotspot.relevance_score >= 80
      ? 'success'
      : hotspot.relevance_score >= 60
      ? 'warning'
      : 'default';

  const isHighImportance = hotspot.importance && hotspot.importance >= 8;

  // 获取来源标签
  const sourceLabel = sourceLabels[hotspot.source_type] || hotspot.source_type;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await hotspotsApi.delete(hotspot.id);
      setShowConfirm(false);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete hotspot:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

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
            <div className="flex items-center gap-1 flex-shrink-0">
              {showDelete && (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={deleting}
                  className="p-2 rounded-lg bg-[#1a1a25] text-[#9ca3af] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <a
                href={hotspot.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#1a1a25] text-[#9ca3af] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
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
              {formatRelativeTime(hotspot.published_at || hotspot.created_at)}
            </span>
          </div>
        </div>
      </Card>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="确认删除"
        message={`确定要删除热点 "${hotspot.title.slice(0, 50)}${hotspot.title.length > 50 ? '...' : ''}" 吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        confirmVariant="danger"
      />
    </motion.div>
  );
}
