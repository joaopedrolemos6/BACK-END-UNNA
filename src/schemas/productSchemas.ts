import { z } from 'zod';

export const productBaseSchema = z.object({
  categoryId: z.number().int().positive(),
  slug: z.string().min(1).max(191),
  name: z.string().min(1).max(191),
  description: z.string().max(5000).optional().nullable(),
  price: z.number().nonnegative(),
  oldPrice: z.number().nonnegative().optional().nullable(),
  discountPercent: z.number().int().min(0).max(100).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  isFeatured: z.boolean().default(false)
});

export const productVariantSchema = z.object({
  sizeId: z.number().int().positive(),
  colorId: z.number().int().positive(),
  sku: z.string().max(100).optional().nullable(),
  stock: z.number().int().nonnegative(),
  price: z.number().nonnegative().optional().nullable()
});

export const productImageSchema = z.object({
  imageUrl: z.string().url().max(500),
  isMain: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0)
});

export const createProductSchema = productBaseSchema.extend({
  variants: z.array(productVariantSchema).min(1),
  images: z.array(productImageSchema).min(1)
});

export const updateProductSchema = productBaseSchema.partial().extend({
  variants: z.array(productVariantSchema).optional(),
  images: z.array(productImageSchema).optional()
});
