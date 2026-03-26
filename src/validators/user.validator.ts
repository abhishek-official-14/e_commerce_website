import { z } from 'zod';

export const updateUserBlockStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    isBlocked: z.boolean()
  })
});
