import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Trash2,
  Check,
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
  // 批量选择相关
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
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

// 相关性标签配置（无前缀后缀）
const relevanceLabels: Record<string, { label: string; variant: 'error' | 'warning' | 'info' | 'default' }> = {
  core: { label: '直击核心', variant: 'error' },       // >= 80
  relevant: { label: '高度贴合', variant: 'warning' },  // 60-79
  partial: { label: '轻度关联', variant: 'info' },     // 40-59
};

// 热度标签配置（无前缀后缀）
const heatLabels: Record<string, { label: string; variant: 'error' | 'warning' | 'info' | 'default' }> = {
  viral: { label: '刷屏级', variant: 'error' },       // >= 90
  hot: { label: '热议中', variant: 'warning' },        // 70-89
  growing: { label: '持续发酵', variant: 'info' },     // 40-69
  cold: { label: '无人问津', variant: 'default' },    // < 40
};

// 语言标识配置
const languageLabels: Record<string, string> = {
  zh: '中文',
  en: '英文',
};

export function HotspotCard({ hotspot, index = 0, onDelete, showDelete = false, selectable = false, selected = false, onSelect }: HotspotCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 高热度卡片发光效果（热度值 >= 70）
  const isHighHeat = hotspot.importance && hotspot.importance >= 70;

  // 获取来源标签
  const sourceLabel = sourceLabels[hotspot.source_type] || hotspot.source_type;

  // 获取相关性标签
  const relevanceInfo = hotspot.relevance_level
    ? relevanceLabels[hotspot.relevance_level]
    : null;

  // 获取热度标签
  const heatInfo = hotspot.heat_level
    ? heatLabels[hotspot.heat_level]
    : null;

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
        glow={isHighHeat ? 'pink' : 'none'}
        className={`${isHighHeat ? 'border-[#ff3366]/30' : ''} ${selected ? 'border-[#ff3366]' : ''}`}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-[#f0f0f5] leading-tight line-clamp-2">
              {hotspot.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* 批量模式下只显示勾选框 */}
              {selectable ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect?.(hotspot.id); }}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${selected
                      ? 'bg-gradient-to-r from-[#ff3366] to-[#9933ff] text-white'
                      : 'bg-[#1a1a25] text-[#9ca3af] hover:text-[#ff3366] border border-[#2a2a3a] hover:border-[#ff3366]/50'
                    }
                  `}
                  title={selected ? '取消选择' : '选择'}
                >
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <>
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
                </>
              )}
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
          <div className="flex items-end justify-between pt-3 border-t border-[#2a2a3a]">
            <div className="flex items-center gap-2 flex-wrap">
              {/* 来源类型 */}
              <Badge variant="info" size="sm">
                {sourceLabel}
              </Badge>

              {/* 相关性标签 - 只显示标签，无分数 */}
              {relevanceInfo && (
                <Badge variant={relevanceInfo.variant} size="sm">
                  {relevanceInfo.label}
                </Badge>
              )}

              {/* 热度标签 - 只显示标签，无分数 */}
              {heatInfo && (
                <Badge variant={heatInfo.variant} size="sm">
                  {heatInfo.label}
                </Badge>
              )}

              {/* 语言标识 */}
              {hotspot.language && (
                <Badge variant="default" size="sm">
                  {languageLabels[hotspot.language] || hotspot.language}
                </Badge>
              )}

              {/* 关键词 */}
              {hotspot.keyword && (
                <Badge variant="default" size="sm">
                  {hotspot.keyword.keyword}
                </Badge>
              )}
            </div>

            {/* Date */}
            <span className="text-xs text-[#6b7280] whitespace-nowrap">
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
