import { useState, useEffect } from 'react';
import { Flame, Filter } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { HotspotCard } from '../components/hotspots/HotspotCard';
import type { Hotspot } from '../types';
import { hotspotsApi } from '../api/client';

export function Hotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'real' | 'fake'>('all');

  useEffect(() => {
    loadHotspots();
  }, []);

  const loadHotspots = async () => {
    try {
      setLoading(true);
      const data = await hotspotsApi.getAll({ limit: 50 });
      setHotspots(data);
    } catch (error) {
      console.error('Failed to load hotspots:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotspots = hotspots.filter(h => {
    if (filter === 'real') return !h.is_fake;
    if (filter === 'fake') return h.is_fake;
    return true;
  });

  return (
    <div className="space-y-8">
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

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-[#6b7280] mr-2" />
        {(['all', 'real', 'fake'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${filter === f
                ? 'bg-gradient-to-r from-[#ff3366] to-[#9933ff] text-white'
                : 'bg-[#1a1a25] text-[#9ca3af] hover:text-[#f0f0f5] border border-[#2a2a3a]'
              }
            `}
          >
            {f === 'all' ? '全部' : f === 'real' ? '可信内容' : '可疑内容'}
          </button>
        ))}
      </div>

      {/* Hotspots Grid - Masonry Layout */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      ) : filteredHotspots.length === 0 ? (
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
        <div className="masonry-grid">
          {filteredHotspots.map((hotspot, index) => (
            <div key={hotspot.id} className="break-inside-avoid mb-4">
              <HotspotCard
                hotspot={hotspot}
                index={index}
                showDelete
                onDelete={loadHotspots}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}