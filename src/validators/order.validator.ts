import { z } from 'zod';

const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2),
  line1: z.string().trim().min(5),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  postalCode: z.string().trim().min(3),
  country: z.string().trim().min(2),
  phone: z.string().trim().optional()
});

export const createOrderSchema = z.object({
  body: z
    .object({
      address: z.string().min(5).optional(),
      addressId: z.string().min(1).optional(),
      shippingAddress: shippingAddressSchema.optional(),
      couponCode: z.string().trim().min(3).max(32).optional(),
      currency: z.string().trim().toUpperCase().default('INR')
    })
    .refine((body) => Boolean(body.addressId || body.address || body.shippingAddress), {
      message: 'Provide addressId, address or shippingAddress'
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
