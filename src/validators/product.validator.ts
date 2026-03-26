import { z } from 'zod';

const toNumber = z.coerce.number();
const toBoolean = z.preprocess((value) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return value;
}, z.boolean());
const imageArray = z.preprocess((value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [value];
    }
  }
  return value;
}, z.array(z.string().url()));

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    price: toNumber.min(0),
    description: z.string().min(3),
    category: z.string().min(2),
    stock: toNumber.int().min(0),
    images: imageArray.optional(),
    isActive: toBoolean.optional()
  })
});

export const updateProductSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      price: toNumber.min(0).optional(),
      description: z.string().min(3).optional(),
      category: z.string().min(2).optional(),
      stock: toNumber.int().min(0).optional(),
      images: imageArray.optional(),
      isActive: toBoolean.optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required for update'
    })
});

export const getProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional()
  })
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const purchaseProductSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    quantity: z.coerce.number().int().min(1).default(1)
  })
});


export const createReviewSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().min(5).max(1000)
  })
});
