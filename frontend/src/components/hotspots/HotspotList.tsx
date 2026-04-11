import type { Hotspot } from '../../types';
import { HotspotCard } from './HotspotCard';
import { Loading } from '../common/Loading';
import { Activity } from 'lucide-react';

interface HotspotListProps {
  hotspots: Hotspot[];
  loading?: boolean;
  emptyText?: string;
}

export function HotspotList({
  hotspots,
  loading,
  emptyText = '暂无热点',
}: HotspotListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (hotspots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1a1a25] flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-[#6b7280]" />
        </div>
        <p className="text-[#9ca3af]">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {hotspots.map((hotspot, index) => (
        <div key={hotspot.id} className="break-inside-avoid mb-4">
          <HotspotCard hotspot={hotspot} index={index} />
        </div>
      ))}
    </div>
  );
}
