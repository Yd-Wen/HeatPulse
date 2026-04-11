import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// GET /api/keywords - 获取所有关键词
router.get('/', async (req, res) => {
  const { active } = req.query;

  const where = active === 'true' ? { is_active: true } :
                active === 'false' ? { is_active: false } : {};

  const keywords = await prisma.keyword.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      _count: {
        select: { hotspots: true }
      }
    }
  });

  res.json(keywords);
});

// POST /api/keywords - 创建关键词
router.post('/', async (req, res) => {
  const { keyword, category, notify_email } = req.body;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  const existing = await prisma.keyword.findFirst({
    where: { keyword: keyword.trim() }
  });

  if (existing) {
    return res.status(409).json({ error: 'Keyword already exists' });
  }

  const newKeyword = await prisma.keyword.create({
    data: {
      keyword: keyword.trim(),
      category: category || null,
      notify_email: notify_email || null,
      is_active: true
    }
  });

  res.status(201).json(newKeyword);
});

// PATCH /api/keywords/:id - 更新关键词
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { keyword, category, is_active, notify_email } = req.body;

  const existing = await prisma.keyword.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existing) {
    return res.status(404).json({ error: 'Keyword not found' });
  }

  const updated = await prisma.keyword.update({
    where: { id: parseInt(id) },
    data: {
      ...(keyword !== undefined && { keyword: keyword.trim() }),
      ...(category !== undefined && { category: category || null }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      ...(notify_email !== undefined && { notify_email: notify_email || null })
    }
  });

  res.json(updated);
});

// DELETE /api/keywords/:id - 删除关键词
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.keyword.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existing) {
    return res.status(404).json({ error: 'Keyword not found' });
  }

  await prisma.keyword.delete({
    where: { id: parseInt(id) }
  });

  res.status(204).send();
});

export default router;
