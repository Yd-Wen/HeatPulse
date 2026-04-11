import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Zap,
  Flame,
  TrendingUp,
  RefreshCw,
  Play,
  Plus,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { HotspotList } from '../components/hotspots/HotspotList';
import { RealtimeIndicator } from '../components/hotspots/RealtimeIndicator';
import type { Stats, Hotspot, ScanStatus } from '../types';
import { statsApi, hotspotsApi, scanApi, keywordsApi } from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [quickKeyword, setQuickKeyword] = useState('');
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const { connected, lastMessage } = useWebSocket();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'NEW_HOTSPOT' && lastMessage.data) {
      setHotspots((prev) => [lastMessage.data as Hotspot, ...prev.slice(0, 5)]);
    }
    if (lastMessage?.type === 'SCAN_COMPLETE') {
      loadData();
    }
  }, [lastMessage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, hotspotsData, statusData] = await Promise.all([
        statsApi.get(),
        hotspotsApi.getAll({ limit: 6 }),
        scanApi.getStatus(),
      ]);
      setStats(statsData);
      setHotspots(hotspotsData);
      setScanStatus(statusData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickKeyword.trim()) return;

    try {
      setAdding(true);
      // 先创建临时关键词
      const keyword = await keywordsApi.create(quickKeyword.trim());
      // 只扫描这个关键词
      await scanApi.trigger([keyword.id]);
      setQuickKeyword('');
      setAddSuccess(true);
      // 刷新统计数据
      const statsData = await statsApi.get();
      setStats(statsData);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to quick scan:', error);
      alert('扫描失败，请重试');
    } finally {
      setAdding(false);
    }
  };

  const handleScanAll = async () => {
    try {
      setTriggering(true);
      await scanApi.trigger();
      const status = await scanApi.getStatus();
      setScanStatus(status);
    } catch (error) {
      console.error('Failed to scan all:', error);
    } finally {
      setTriggering(false);
    }
  };

  const statCards = [
    {
      title: '监控关键词',
      value: stats?.total_keywords ?? 0,
      active: stats?.active_keywords ?? 0,
      icon: Zap,
      color: 'from-[#ff3366] to-[#ff6b35]',
    },
    {
      title: '发现热点',
      value: stats?.total_hotspots ?? 0,
      subtext: `今日 +${stats?.today_hotspots ?? 0}`,
      icon: Flame,
      color: 'from-[#ff6b35] to-[#9933ff]',
    },
    {
      title: '实时推送',
      value: stats?.real_time_hotspots ?? 0,
      subtext: '已通知',
      icon: Activity,
      color: 'from-[#9933ff] to-[#00d4ff]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">仪表盘</h1>
          <p className="text-[#9ca3af] mt-1">
            实时监控 AI 热点动态
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeIndicator connected={connected} />
          <Button
            onClick={handleScanAll}
            loading={triggering}
            variant="secondary"
          >
            <Play className="w-4 h-4" />
            开始扫描
          </Button>
          <Button
            onClick={loadData}
            variant="ghost"
            className="p-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Scan */}
      <Card className="bg-gradient-to-r from-[#1a1a25] to-[#0f0f15] border border-[#2a2a3a]">
        <form onSubmit={handleQuickScan} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="输入关键词快速搜索热点..."
              value={quickKeyword}
              onChange={(e) => setQuickKeyword(e.target.value)}
              disabled={adding}
              className="w-full"
            />
            {addSuccess && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm"
              >
                扫描中...
              </motion.span>
            )}
          </div>
          <Button
            type="submit"
            loading={adding}
            disabled={!quickKeyword.trim()}
            className="sm:w-auto"
          >
            <Zap className="w-4 h-4" />
            立即扫描
          </Button>
        </form>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 rounded-bl-full`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#9ca3af] text-sm">{card.title}</p>
                  <p className="text-3xl font-bold text-[#f0f0f5] mt-1">
                    {loading ? '-' : card.value}
                  </p>
                  {card.active !== undefined && (
                    <p className="text-sm text-green-400 mt-1">
                      {card.active} 个活跃中
                    </p>
                  )}
                  {card.subtext && (
                    <p className="text-sm text-[#6b7280] mt-1">
                      {card.subtext}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Scan Status */}
      {scanStatus && (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              scanStatus.is_scanning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
            }`} />
            <span className="text-[#9ca3af]">
              {scanStatus.is_scanning ? '正在扫描中...' : '扫描就绪'}
            </span>
          </div>
          <div className="text-sm text-[#6b7280]">
            {scanStatus.last_scan && (
              <span>上次扫描: {new Date(scanStatus.last_scan).toLocaleString('zh-CN')}</span>
            )}
          </div>
        </Card>
      )}

      {/* Latest Hotspots */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#f0f0f5]">最新热点</h2>
          <Button variant="ghost" size="sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            查看全部
          </Button>
        </div>
        <HotspotList hotspots={hotspots} loading={loading} />
      </div>
    </div>
  );
}
