import { useState, useEffect } from 'react';
import { Flame, ArrowUp, ArrowDown, Search, Calendar, Trash2 } from 'lucide-react';
import Masonry from 'react-masonry-css';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { Modal } from '../components/common/Modal';
import { HotspotCard } from '../components/hotspots/HotspotCard';
import type { Hotspot, HotspotsQueryParams, SortField, Keyword } from '../types';
import { hotspotsApi, keywordsApi } from '../api/client';

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'created_at', label: '发布时间' },
  { field: 'importance', label: '热度' },
  { field: 'relevance_score', label: '相关性' },
];

// 关键词筛选选项（动态生成）
const getKeywordOptions = (keywords: Keyword[]) => [
  { value: undefined, label: '全部关键词' },
  ...keywords.map(k => ({ value: k.id, label: k.keyword })),
];

const sourceOptions = [
  { value: '', label: '全部来源' },
  { value: 'sogou', label: '搜狗' },
  { value: 'bilibili', label: 'B站' },
  { value: 'twitter', label: 'X' },
] as const;

// 相关性筛选选项
const relevanceOptions = [
  { value: '', label: '全部相关性' },
  { value: 'core', label: '直击核心' },
  { value: 'relevant', label: '高度贴合' },
  { value: 'partial', label: '轻度关联' },
] as const;

// 热度筛选选项
const heatOptions = [
  { value: '', label: '全部热度' },
  { value: 'viral', label: '刷屏级' },
  { value: 'hot', label: '热议中' },
  { value: 'growing', label: '持续发酵' },
  { value: 'cold', label: '无人问津' },
] as const;

const timeRangeOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: '7days', label: '7天内' },
] as const;

export function Hotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  // 关键词筛选状态
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | undefined>(undefined);

  // 单字段排序配置
  const [activeSortField, setActiveSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sourceType, setSourceType] = useState<string>('');
  const [relevanceLevel, setRelevanceLevel] = useState<string>('');
  const [heatLevel, setHeatLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 时间范围筛选：today/7days/all
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'all'>('all');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 批量删除状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);  // 批量删除模式开关

  // 派生状态
  const isAllSelected = hotspots.length > 0 && selectedIds.size === hotspots.length;
  const selectedCount = selectedIds.size;

  // 加载关键词列表
  useEffect(() => {
    keywordsApi.getAll().then(setKeywords).catch(console.error);
  }, []);

  useEffect(() => {
    loadHotspots();
  }, [activeSortField, sortOrder, sourceType, relevanceLevel, heatLevel, timeRange, selectedKeywordId, currentPage]);

  // 根据 timeRange 计算时间范围
  const getTimeRangeParams = (): { start_date?: string; end_date?: string } => {
    if (timeRange === 'all') return {};

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (timeRange === 'today') {
      return {
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString(),
      };
    }

    if (timeRange === '7days') {
      const sevenDaysAgo = new Date(startOfDay);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return {
        start_date: sevenDaysAgo.toISOString(),
        end_date: endOfDay.toISOString(),
      };
    }

    return {};
  };

  const handleSortToggle = (field: SortField) => {
    if (field === activeSortField) {
      // 点击当前激活的字段，切换排序方向
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // 点击其他字段，切换到该字段，使用默认降序
      setActiveSortField(field);
      setSortOrder('desc');
    }
  };

  const loadHotspots = async () => {
    try {
      setLoading(true);
      const params: HotspotsQueryParams = {
        page: currentPage,
        limit: 9,
        sort_by: activeSortField,
        sort_order: sortOrder,
      };

      if (sourceType) params.source_type = sourceType;
      if (relevanceLevel) params.relevance_level = relevanceLevel as any;
      if (heatLevel) params.heat_level = heatLevel as any;
      if (searchQuery) params.search = searchQuery;

      // 添加关键词筛选参数
      if (selectedKeywordId !== undefined) {
        params.keyword_id = selectedKeywordId;
      }

      // 添加时间范围参数
      const timeParams = getTimeRangeParams();
      if (timeParams.start_date) params.start_date = timeParams.start_date;
      if (timeParams.end_date) params.end_date = timeParams.end_date;

      const result = await hotspotsApi.getAll(params);
      setHotspots(result.data);
      setTotalPages(result.pagination.total_pages);
    } catch (error) {
      console.error('Failed to load hotspots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadHotspots();
  };

  const handleClearFilters = () => {
    setActiveSortField('created_at');
    setSortOrder('desc');
    setSelectedKeywordId(undefined);
    setSourceType('');
    setRelevanceLevel('');
    setHeatLevel('');
    setSearchQuery('');
    setTimeRange('all');
    setCurrentPage(1);
  };

  // 切换批量删除模式
  const toggleBatchMode = () => {
    if (isBatchMode) {
      // 退出批量模式时清除选中
      setIsBatchMode(false);
      setSelectedIds(new Set());
    } else {
      // 进入批量模式
      setIsBatchMode(true);
    }
  };

  // 切换单张卡片选中
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(hotspots.map(h => h.id)));
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    try {
      setBatchDeleting(true);
      await Promise.all([...selectedIds].map(id => hotspotsApi.delete(id)));
      setSelectedIds(new Set());
      setShowBatchConfirm(false);
      loadHotspots();
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('删除失败，请重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">热点列表</h1>
          <p className="text-[#9ca3af] mt-1">
            查看所有 AI 识别发现的热点内容
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadHotspots} variant="secondary">
            <Flame className="w-4 h-4" />
            刷新
          </Button>
          <Button
            onClick={toggleBatchMode}
            variant={isBatchMode ? 'secondary' : 'danger'}
          >
            {isBatchMode ? '取消' : '批量删除'}
          </Button>
        </div>
      </div>

      {/* Sort and Filter Controls */}
      <div className="space-y-4">
        {/* Row 1: Sort Buttons - 单字段排序 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#6b7280] mr-1">排序:</span>
          {sortOptions.map((opt) => {
            const isActive = activeSortField === opt.field;
            return (
              <button
                key={opt.field}
                onClick={() => handleSortToggle(opt.field)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-[#ff3366]/20 border-[#ff3366] text-[#f0f0f5]'
                  : 'bg-[#1a1a25] border-[#2a2a3a] text-[#6b7280] hover:text-[#f0f0f5] hover:border-[#ff3366]/50'
                  } border`}
                title={`${opt.label}${isActive ? (sortOrder === 'asc' ? ' (升序)' : ' (降序)') : ''}`}
              >
                {opt.label}
                {isActive &&
                  (sortOrder === 'asc' ? (
                    <ArrowUp className="w-3 h-3 text-[#00d4ff]" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-[#ff3366]" />
                  ))}
              </button>
            );
          })}
        </div>

        {/* Row 2: Advanced Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedKeywordId ?? ''}
            onChange={(e) => {
              setSelectedKeywordId(e.target.value ? Number(e.target.value) : undefined);
              setCurrentPage(1);
            }}
            className="bg-[#1a1a25] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] focus:outline-none focus:border-[#ff3366]"
          >
            {getKeywordOptions(keywords).map(opt => (
              <option key={opt.value ?? ''} value={opt.value ?? ''}>{opt.label}</option>
            ))}
          </select>

          <select
            value={sourceType}
            onChange={(e) => {
              setSourceType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#1a1a25] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] focus:outline-none focus:border-[#ff3366]"
          >
            {sourceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={relevanceLevel}
            onChange={(e) => {
              setRelevanceLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#1a1a25] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] focus:outline-none focus:border-[#ff3366]"
          >
            {relevanceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={heatLevel}
            onChange={(e) => {
              setHeatLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#1a1a25] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] focus:outline-none focus:border-[#ff3366]"
          >
            {heatOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6b7280]" />
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value as 'today' | '7days' | 'all');
                setCurrentPage(1);
              }}
              className="bg-[#1a1a25] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] focus:outline-none focus:border-[#ff3366]"
            >
              {timeRangeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索标题/内容/摘要..."
              className="flex-1 bg-[#1a1a25] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] placeholder-[#6b7280] focus:outline-none focus:border-[#ff3366]"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#ff3366] to-[#9933ff] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              搜索
            </button>
          </div>

          <button
            onClick={handleClearFilters}
            className="px-3 py-2 rounded-lg bg-[#1a1a25] text-[#9ca3af] hover:text-[#f0f0f5] border border-[#2a2a3a] text-sm transition-colors"
          >
            清除筛选
          </button>
        </div>

        {/* 批量操作栏（仅批量模式显示） */}
        {isBatchMode && (
          <div className="flex items-center gap-4 bg-[#1a1a25] rounded-xl px-4 py-3 border border-[#2a2a3a]"
          >
            {/* 全选复选框 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#ff3366]"
              />
              <span className="text-sm text-[#9ca3af]">全选</span>
            </label>

            <div className="w-px h-6 bg-[#2a2a3a]" />

            <span className="text-sm text-[#f0f0f5]">已选择 {selectedCount} 项</span>

            <div className="flex-1" />

            <Button
              variant="danger"
              size="sm"
              loading={batchDeleting}
              disabled={selectedCount === 0}
              onClick={() => setShowBatchConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              删除选中
            </Button>
          </div>
        )}
      </div>

      {/* Hotspots Grid - Masonry Layout */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      ) : hotspots.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#1a1a25] flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-[#6b7280]" />
          </div>
          <p className="text-[#9ca3af]">暂无热点数据</p>
          <p className="text-sm text-[#6b7280] mt-1">
            系统会自动扫描并发现相关热点
          </p>
        </Card>
      ) : (
        <Masonry
          breakpointCols={{
            default: 3,
            1280: 3,
            1024: 2,
            768: 2,
            640: 1
          }}
          className="masonry-grid"
          columnClassName="masonry-grid-column"
        >
          {hotspots.map((hotspot, index) => (
            <div key={hotspot.id} className="mb-4">
              <HotspotCard
                hotspot={hotspot}
                index={index}
                showDelete
                onDelete={loadHotspots}
                selectable={isBatchMode}
                selected={selectedIds.has(hotspot.id)}
                onSelect={toggleSelect}
              />
            </div>
          ))}
        </Masonry>
      )}

      {/* 分页组件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] text-sm text-[#f0f0f5] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#ff3366]/50 transition-colors"
          >
            上一页
          </button>

          <span className="text-sm text-[#f0f0f5]">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-[#1a1a25] border border-[#2a2a3a] text-sm text-[#f0f0f5] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#ff3366]/50 transition-colors"
          >
            下一页
          </button>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      <Modal
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        title="确认批量删除"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowBatchConfirm(false)}>
              取消
            </Button>
            <Button variant="danger" loading={batchDeleting} onClick={handleBatchDelete}>
              确认删除
            </Button>
          </div>
        }
      >
        <p className="text-[#9ca3af]">
          确定要删除选中的 {selectedCount} 条热点吗？此操作不可恢复。
        </p>
      </Modal>
    </div>
  );
}