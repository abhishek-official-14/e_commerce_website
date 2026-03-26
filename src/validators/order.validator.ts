import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    address: z.string().min(5),
    currency: z.string().trim().toUpperCase().default('INR')
  })
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_payment_id: z.string().min(1),
    razorpay_order_id: z.string().min(1),
    razorpay_signature: z.string().min(1)
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
