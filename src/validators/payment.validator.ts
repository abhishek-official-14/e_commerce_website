import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  body: z.object({
    orderId: z.string().min(1)
  })
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_payment_id: z.string().min(1),
    razorpay_order_id: z.string().min(1),
    razorpay_signature: z.string().min(1)
  })
});
