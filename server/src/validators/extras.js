import { z } from 'zod';
import { objectId } from './common.js';

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating is 1-5').max(5, 'Rating is 1-5'),
  comment: z.string().trim().max(1000).optional().default(''),
});

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Code must be at least 3 characters')
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, - and _ only'),
    kind: z.enum(['percent', 'fixed']),
    value: z.coerce.number().int().min(1),
    currency: z.enum(['JPY', 'USD', 'ANY']).default('ANY'),
    course: objectId.optional(),
    expiresAt: z.coerce.date().optional(),
    maxUses: z.coerce.number().int().min(0).default(0),
  })
  .refine((v) => v.kind !== 'percent' || v.value <= 100, { message: 'Percent must be 1-100', path: ['value'] });
