import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1)
  })
});

export const updateCartItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1)
  })
});

export const removeFromCartSchema = z.object({
  params: z.object({
    productId: z.string().min(1)
  })
});
