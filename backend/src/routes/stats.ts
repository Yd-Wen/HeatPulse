import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// GET /api/stats - 获取统计数据
router.get('/', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    total_keywords,
    active_keywords,
    total_hotspots,
    today_hotspots,
    real_time_hotspots
  ] = await Promise.all([
    prisma.keyword.count(),
    prisma.keyword.count({ where: { is_active: true } }),
    prisma.hotspot.count(),
    prisma.hotspot.count({
      where: {
        created_at: { gte: today }
      }
    }),
    prisma.hotspot.count({
      where: {
        is_fake: false,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
        }
      }
    })
  ]);

  // 按来源统计热点
  const hotspotsBySource = await prisma.hotspot.groupBy({
    by: ['source_type'],
    _count: { id: true }
  });

  // 最近7天的热点趋势
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date;
  }).reverse();

  const dailyStats = await Promise.all(
    last7Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await prisma.hotspot.count({
        where: {
          created_at: {
            gte: date,
            lt: nextDay
          }
        }
      });

      return {
        date: date.toISOString().split('T')[0],
        count
      };
    })
  );

  res.json({
    total_keywords,
    active_keywords,
    total_hotspots,
    today_hotspots,
    real_time_hotspots,
    hotspots_by_source: hotspotsBySource.reduce((acc, item) => {
      acc[item.source_type] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
    daily_stats: dailyStats
  });
});

export default router;
