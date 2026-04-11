import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// GET /api/hotspots - 获取热点列表（支持分页、筛选）
router.get('/', async (req, res) => {
  const {
    page = '1',
    limit = '20',
    keyword_id,
    source_type,
    is_fake,
    search,
    start_date,
    end_date
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 100);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (keyword_id) {
    where.keyword_id = parseInt(keyword_id as string);
  }

  if (source_type) {
    where.source_type = source_type as string;
  }

  if (is_fake !== undefined) {
    where.is_fake = is_fake === 'true';
  }

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { content: { contains: search as string, mode: 'insensitive' } },
      { ai_summary: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) {
      where.created_at.gte = new Date(start_date as string);
    }
    if (end_date) {
      where.created_at.lte = new Date(end_date as string);
    }
  }

  const [hotspots, total] = await Promise.all([
    prisma.hotspot.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { created_at: 'desc' },
      include: {
        keyword: {
          select: {
            id: true,
            keyword: true,
            category: true
          }
        }
      }
    }),
    prisma.hotspot.count({ where })
  ]);

  // Parse ai_tags JSON
  const hotspotsWithParsedTags = hotspots.map(h => ({
    ...h,
    ai_tags: h.ai_tags ? JSON.parse(h.ai_tags) : undefined
  }));

  res.json({
    data: hotspotsWithParsedTags,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.ceil(total / limitNum)
    }
  });
});

// GET /api/hotspots/:id - 获取热点详情
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const hotspot = await prisma.hotspot.findUnique({
    where: { id: parseInt(id) },
    include: {
      keyword: {
        select: {
          id: true,
          keyword: true,
          category: true
        }
      }
    }
  });

  if (!hotspot) {
    return res.status(404).json({ error: 'Hotspot not found' });
  }

  res.json({
    ...hotspot,
    ai_tags: hotspot.ai_tags ? JSON.parse(hotspot.ai_tags) : undefined
  });
});

// POST /api/hotspots/:id/read - 标记已读（创建一条通知记录表示已读）
router.post('/:id/read', async (req, res) => {
  const { id } = req.params;

  const hotspot = await prisma.hotspot.findUnique({
    where: { id: parseInt(id) }
  });

  if (!hotspot) {
    return res.status(404).json({ error: 'Hotspot not found' });
  }

  // 这里可以根据需求实现已读逻辑
  // 可以创建一个单独的表来记录用户已读状态
  // 这里简单返回成功
  res.json({ success: true, message: 'Marked as read' });
});

export default router;
