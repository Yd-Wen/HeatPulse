import { motion } from 'framer-motion';
import { Trash2, Bell, BellOff, Tag } from 'lucide-react';
import type { Keyword } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Switch } from '../common/Switch';

interface KeywordCardProps {
  keyword: Keyword;
  onToggle: (id: number, active: boolean) => void;
  onDelete: (id: number) => void;
  index?: number;
}

export function KeywordCard({
  keyword,
  onToggle,
  onDelete,
  index = 0,
}: KeywordCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card hover className="relative overflow-hidden">
        {/* Active indicator */}
        {keyword.is_active && (
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ff3366] to-[#9933ff]" />
        )}

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[#f0f0f5] truncate">
                {keyword.keyword}
              </h3>
              {keyword.category && (
                <div className="flex items-center gap-1 mt-1 text-[#6b7280]">
                  <Tag className="w-3 h-3" />
                  <span className="text-xs">{keyword.category}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => onDelete(keyword.id)}
              className="p-2 rounded-lg text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between pt-3 border-t border-[#2a2a3a]">
            <div className="flex items-center gap-2">
              {keyword.is_active ? (
                <Badge variant="success" size="sm">
                  <Bell className="w-3 h-3 mr-1" />
                  监控中
                </Badge>
              ) : (
                <Badge variant="default" size="sm">
                  <BellOff className="w-3 h-3 mr-1" />
                  已暂停
                </Badge>
              )}
            </div>
            <Switch
              checked={keyword.is_active}
              onChange={(checked) => onToggle(keyword.id, checked)}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
