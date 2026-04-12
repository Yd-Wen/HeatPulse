import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// 辅助函数：根据importance数值获取分类级别
function getImportanceLevel(importance: number | null | undefined): string {
  if (!importance) return 'low';
  if (importance >= 9) return 'urgent';
  if (importance >= 7) return 'high';
  if (importance >= 4) return 'medium';
  return 'low';
}

// GET /api/hotspots - 获取热点列表（支持分页、筛选、排序）
router.get('/', async (req, res) => {
  const {
    page = '1',
    limit = '20',
    keyword_id,
    source_type,
    is_fake,
    search,
    start_date,
    end_date,
    sort_by = 'created_at',
    sort_order = 'desc',
    importance_level
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
      { title: { contains: search as string } },
      { content: { contains: search as string } },
      { ai_summary: { contains: search as string } }
    ];
  }

  // 时间筛选改用 published_at
  if (start_date || end_date) {
    where.published_at = {};
    if (start_date) {
      where.published_at.gte = new Date(start_date as string);
    }
    if (end_date) {
      where.published_at.lte = new Date(end_date as string);
    }
  }

  // 重要性分类筛选
  if (importance_level) {
    const level = importance_level as string;
    if (level === 'urgent') {
      where.importance = { gte: 9, lte: 10 };
    } else if (level === 'high') {
      where.importance = { gte: 7, lte: 8 };
    } else if (level === 'medium') {
      where.importance = { gte: 4, lte: 6 };
    } else if (level === 'low') {
      where.importance = { gte: 1, lte: 3 };
    }
  }

  // 构建多字段排序条件
  // 支持两种格式：
  // 1. 旧格式：sort_by=created_at&sort_order=desc（单字段，向后兼容）
  // 2. 新格式：sort=created_at:desc,importance:desc,relevance_score:desc,source_type:asc（多字段）
  const { sort } = req.query;
  let orderBy: any[] = [];
  const validSortFields = ['created_at', 'importance', 'relevance_score', 'source_type'];

  if (sort) {
    // 新格式：多字段排序
    const sortParts = (sort as string).split(',');
    for (const part of sortParts) {
      const [field, dir] = part.split(':');
      if (validSortFields.includes(field)) {
        // 排序字段为 created_at 时，实际使用 published_at
        const dbField = field === 'created_at' ? 'published_at' : field;
        orderBy.push({ [dbField]: dir === 'asc' ? 'asc' : 'desc' });
      }
    }
  }

  // 如果没有有效的排序参数，使用默认单字段排序（向后兼容）
  if (orderBy.length === 0) {
    let sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    if (sortField === 'created_at') {
      sortField = 'published_at';
    }
    const sortDir = sort_order === 'asc' ? 'asc' : 'desc';
    orderBy.push({ [sortField as string]: sortDir });
  }

  const [hotspots, total] = await Promise.all([
    prisma.hotspot.findMany({
      where,
      skip,
      take: limitNum,
      orderBy,
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

  // Parse ai_tags JSON and add importance_level
  const hotspotsWithParsedTags = hotspots.map(h => ({
    ...h,
    ai_tags: h.ai_tags ? JSON.parse(h.ai_tags) : undefined,
    importance_level: getImportanceLevel(h.importance)
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

// DELETE /api/hotspots/:id - 删除热点
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const hotspot = await prisma.hotspot.findUnique({
    where: { id: parseInt(id) }
  });

  if (!hotspot) {
    return res.status(404).json({ error: 'Hotspot not found' });
  }

  await prisma.hotspot.delete({ where: { id: parseInt(id) } });
  res.json({ success: true, message: 'Hotspot deleted' });
});

export default router;
