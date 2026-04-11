import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Filter, ExternalLink, Shield, ShieldAlert, Sparkles } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Loading } from '../components/common/Loading';
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

      {/* Hotspots Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHotspots.map((hotspot, index) => (
            <HotspotCard key={hotspot.id} hotspot={hotspot} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function HotspotCard({ hotspot, index }: { hotspot: Hotspot; index: number }) {
  const relevanceColor =
    hotspot.relevance_score >= 80
      ? 'success'
      : hotspot.relevance_score >= 60
      ? 'warning'
      : 'default';

  const isHighImportance = hotspot.importance && hotspot.importance >= 8;

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

          {hotspot.ai_summary && (
            <p className="text-sm text-[#9ca3af] line-clamp-3">
              {hotspot.ai_summary}
            </p>
          )}

          {hotspot.ai_tags && hotspot.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hotspot.ai_tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#2a2a3a]">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info" size="sm">
                {hotspot.source_type === 'twitter'
                  ? 'Twitter'
                  : hotspot.source_type === 'search'
                  ? '搜索'
                  : 'API'}
              </Badge>

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

              <Badge variant={relevanceColor} size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                {Math.round(hotspot.relevance_score)}分
              </Badge>
            </div>

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
