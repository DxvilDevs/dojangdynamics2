import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

export const productsRouter = Router();

// Validation schemas
const CreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10),
  priceCents: z.number().int().positive(),
  currency: z.string().default('usd'),
  images: z.array(z.string().url()).min(1),
  category: z.string().min(1),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

const UpdateProductSchema = CreateProductSchema.partial();

// GET /products - public, supports filtering
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, featured, search, sort, order, limit, offset } = req.query;

    const where: Record<string, unknown> = { active: true };
    if (category) where.category = category as string;
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['name', 'priceCents', 'createdAt'];
    const sortField = validSortFields.includes(sort as string) ? (sort as string) : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        take: Math.min(parseInt(limit as string) || 50, 100),
        skip: parseInt(offset as string) || 0,
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({ products, total });
  } catch (err) {
    console.error('Get products error:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /products/:slug - public
productsRouter.get('/:slug', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug, active: true },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /products - admin only
productsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = CreateProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      }

      // Check slug uniqueness
      const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
      if (existing) return res.status(409).json({ error: 'Slug already exists' });

      const product = await prisma.product.create({ data: parsed.data });
      return res.status(201).json(product);
    } catch (err) {
      console.error('Create product error:', err);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// PUT /products/:id - admin only
productsRouter.put(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = UpdateProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      }

      // Check slug uniqueness if updating slug
      if (parsed.data.slug) {
        const existing = await prisma.product.findFirst({
          where: { slug: parsed.data.slug, NOT: { id: req.params.id } },
        });
        if (existing) return res.status(409).json({ error: 'Slug already exists' });
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: parsed.data,
      });

      return res.json(product);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// DELETE /products/:id - admin only
productsRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      // Soft delete
      await prisma.product.update({
        where: { id: req.params.id },
        data: { active: false },
      });
      return res.json({ message: 'Product deleted' });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  }
);

// GET /products/admin/all - admin, includes inactive
productsRouter.get(
  '/admin/all',
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ products, total: products.length });
    } catch {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }
);
