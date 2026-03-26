import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    address: z.string().min(5)
  })
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'failed'])
  })
});
