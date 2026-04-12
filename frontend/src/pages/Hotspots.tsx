import { useState, useEffect } from 'react';
import { Flame, ArrowUp, ArrowDown, Search, Calendar } from 'lucide-react';
import Masonry from 'react-masonry-css';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { HotspotCard } from '../components/hotspots/HotspotCard';
import type { Hotspot, HotspotsQueryParams, SortField } from '../types';
import { hotspotsApi } from '../api/client';

type SortField = 'created_at' | 'importance' | 'relevance_score' | 'source_type';

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'created_at', label: '发布时间' },
  { field: 'importance', label: '重要性' },
  { field: 'relevance_score', label: '相关性分数' },
  { field: 'source_type', label: '信息来源' },
];

const sourceOptions = [
  { value: '', label: '全部来源' },
  { value: 'sogou', label: '搜狗' },
  { value: 'bilibili', label: 'B站' },
  { value: 'twitter', label: 'X' },
] as const;

const importanceOptions = [
  { value: '', label: '全部重要性' },
  { value: 'urgent', label: '紧急 (9-10)' },
  { value: 'high', label: '高 (7-8)' },
  { value: 'medium', label: '中 (4-6)' },
  { value: 'low', label: '低 (1-3)' },
] as const;

const timeRangeOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: '7days', label: '7天内' },
] as const;

export function Hotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  // 单字段排序配置
  const [activeSortField, setActiveSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sourceType, setSourceType] = useState<string>('');
  const [importanceLevel, setImportanceLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 时间范围筛选：today/7days/all
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'all'>('all');

  useEffect(() => {
    loadHotspots();
  }, [activeSortField, sortOrder, sourceType, importanceLevel, timeRange]);

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
        limit: 50,
        sort_by: activeSortField,
        sort_order: sortOrder,
      };

      if (sourceType) params.source_type = sourceType;
      if (importanceLevel) params.importance_level = importanceLevel as any;
      if (searchQuery) params.search = searchQuery;

      // 添加时间范围参数
      const timeParams = getTimeRangeParams();
      if (timeParams.start_date) params.start_date = timeParams.start_date;
      if (timeParams.end_date) params.end_date = timeParams.end_date;

      const data = await hotspotsApi.getAll(params);
      setHotspots(data);
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
    setSourceType('');
    setImportanceLevel('');
    setSearchQuery('');
    setTimeRange('all');
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
        <Button onClick={loadHotspots} variant="secondary">
          <Flame className="w-4 h-4" />
          刷新
        </Button>
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
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
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
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="bg-[#1a1a25] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] focus:outline-none focus:border-[#ff3366]"
          >
            {sourceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={importanceLevel}
            onChange={(e) => setImportanceLevel(e.target.value)}
            className="bg-[#1a1a25] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#f0f0f5] focus:outline-none focus:border-[#ff3366]"
          >
            {importanceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6b7280]" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'today' | '7days' | 'all')}
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
              />
            </div>
          ))}
        </Masonry>
      )}
    </div>
  );
}