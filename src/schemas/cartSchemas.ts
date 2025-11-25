import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.number().int().positive(),
  productVariantId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().min(1).default(1)
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1)
});
