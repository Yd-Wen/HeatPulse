import type { Keyword } from '../../types';
import { KeywordCard } from './KeywordCard';
import { Loading } from '../common/Loading';
import { Zap } from 'lucide-react';

interface KeywordListProps {
  keywords: Keyword[];
  loading?: boolean;
  onToggle: (id: number, active: boolean) => void;
  onDelete: (id: number) => void;
}

export function KeywordList({
  keywords,
  loading,
  onToggle,
  onDelete,
}: KeywordListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1a1a25] flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-[#6b7280]" />
        </div>
        <p className="text-[#9ca3af]">暂无监控关键词</p>
        <p className="text-sm text-[#6b7280] mt-1">
          添加关键词，第一时间获取相关热点
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {keywords.map((keyword, index) => (
        <KeywordCard
          key={keyword.id}
          keyword={keyword}
          onToggle={onToggle}
          onDelete={onDelete}
          index={index}
        />
      ))}
    </div>
  );
}
