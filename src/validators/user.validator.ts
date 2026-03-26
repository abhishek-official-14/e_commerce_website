import { z } from 'zod';

const addressSchema = z.object({
  label: z.string().trim().min(2),
  line1: z.string().trim().min(5),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  postalCode: z.string().trim().min(3),
  country: z.string().trim().min(2).default('India'),
  isDefault: z.boolean().optional()
});

export const updateUserBlockStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    isBlocked: z.boolean()
  })
});

export const productIdParamSchema = z.object({
  params: z.object({
    productId: z.string().min(1)
  })
});

export const addressIdParamSchema = z.object({
  params: z.object({
    addressId: z.string().min(1)
  })
});

export const createAddressSchema = z.object({
  body: addressSchema
});

export const updateAddressSchema = z.object({
  params: z.object({
    addressId: z.string().min(1)
  }),
  body: addressSchema.partial().refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })
});
