import { z } from 'zod';

export const refundSchema = z.object({
  amount: z.coerce.number().int().min(1, 'Amount must be at least 1').optional(), // default: all that is left
  reason: z.string().trim().min(3, 'Write the reason (at least 3 letters)').max(300),
});

export const accessRequestSchema = z.object({
  courseId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid course'),
  reason: z.string().trim().max(300).optional().default(''),
});

export const decisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().trim().max(300).optional().default(''),
});
