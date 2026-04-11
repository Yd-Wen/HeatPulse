import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trash2, Bell, BellOff } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Loading } from '../components/common/Loading';
import { ConfirmModal } from '../components/common/Modal';
import type { Keyword } from '../types';
import { keywordsApi } from '../api/client';

export function Keywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; keyword: string } | null>(null);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      const data = await keywordsApi.getAll();
      setKeywords(data);
    } catch (error) {
      console.error('Failed to load keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      setSubmitting(true);
      await keywordsApi.create(newKeyword.trim(), newCategory.trim() || undefined);
      setNewKeyword('');
      setNewCategory('');
      loadKeywords();
    } catch (error) {
      console.error('Failed to create keyword:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await keywordsApi.update(id, { is_active: !isActive });
      setKeywords(keywords.map(k =>
        k.id === id ? { ...k, is_active: !isActive } : k
      ));
    } catch (error) {
      console.error('Failed to toggle keyword:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await keywordsApi.delete(deleteTarget.id);
      setKeywords(keywords.filter(k => k.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete keyword:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">关键词管理</h1>
        <p className="text-[#9ca3af] mt-1">
          添加要监控的关键词，AI 会自动追踪相关热点
        </p>
      </div>

      {/* Add Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="输入要监控的关键词..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="w-full sm:w-48">
              <Input
                placeholder="分类 (如: AI编程)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button
              type="submit"
              loading={submitting}
              disabled={!newKeyword.trim()}
              className="sm:w-auto"
            >
              <Zap className="w-4 h-4" />
              添加监控
            </Button>
          </div>
        </form>
      </Card>

      {/* Keywords List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      ) : keywords.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#1a1a25] flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-[#6b7280]" />
          </div>
          <p className="text-[#9ca3af]">暂无监控关键词</p>
          <p className="text-sm text-[#6b7280] mt-1">
            添加关键词，第一时间获取相关热点
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {keywords.map((keyword, index) => (
            <motion.div
              key={keyword.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="relative overflow-hidden">
                {/* Active indicator */}
                {keyword.is_active && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ff3366] to-[#9933ff]" />
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#f0f0f5] truncate">
                        {keyword.keyword}
                      </h3>
                      {keyword.category && (
                        <Badge variant="default" size="sm" className="mt-1">
                          {keyword.category}
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteTarget({ id: keyword.id, keyword: keyword.keyword })}
                      className="p-2 rounded-lg text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2a2a3a]">
                    <Badge variant={keyword.is_active ? 'success' : 'default'} size="sm">
                      {keyword.is_active ? (
                        <><Bell className="w-3 h-3 mr-1" />监控中</>
                      ) : (
                        <><BellOff className="w-3 h-3 mr-1" />已暂停</>
                      )}
                    </Badge>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={keyword.is_active}
                        onChange={() => handleToggle(keyword.id, keyword.is_active)}
                      />
                      <div className={`
                        w-11 h-6 rounded-full transition-all duration-200
                        ${keyword.is_active
                          ? 'bg-gradient-to-r from-[#ff3366] to-[#9933ff]'
                          : 'bg-[#2a2a3a]'
                        }
                      `}>
                        <div className={`
                          absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
                          ${keyword.is_active ? 'translate-x-5' : 'translate-x-0'}
                        `} />
                      </div>
                    </label>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="确认删除"
        message={`确定要删除关键词 "${deleteTarget?.keyword}" 吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        confirmVariant="danger"
      />
    </div>
  );
}
