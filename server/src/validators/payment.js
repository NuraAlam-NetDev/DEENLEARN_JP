import { z } from 'zod';
import { objectId } from './common.js';

// Card (Stripe) in JPY or USD, or cash to the teacher (always JPY)
export const checkoutSchema = z.object({
  courseId: objectId,
  provider: z.enum(['stripe', 'cash']),
  currency: z.enum(['JPY', 'USD']).optional(),
  couponCode: z.string().trim().max(30).optional(),
  installments: z.coerce.number().int().optional(),
  amount: z.coerce.number().int().min(1).optional(),
});
