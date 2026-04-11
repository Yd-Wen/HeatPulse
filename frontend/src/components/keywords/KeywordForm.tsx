import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface KeywordFormProps {
  onSubmit: (keyword: string, category?: string) => void;
  loading?: boolean;
}

export function KeywordForm({ onSubmit, loading }: KeywordFormProps) {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    onSubmit(keyword.trim(), category.trim() || undefined);
    setKeyword('');
    setCategory('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="输入要监控的关键词..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="w-full sm:w-40">
          <Input
            placeholder="分类 (可选)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          loading={loading}
          disabled={!keyword.trim()}
          className="sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          添加
        </Button>
      </div>
    </form>
  );
}
