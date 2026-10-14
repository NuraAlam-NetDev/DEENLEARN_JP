import { z } from 'zod';

// Grace period (days), free access, automatic emails: the admin's choices for one plan
export const policySchema = z
  .object({
    graceDays: z.coerce.number().int().min(0, 'Grace is 0-60 days').max(60, 'Grace is 0-60 days').optional(),
    accessMode: z.enum(['normal', 'free']).optional(),
    emailOnOverdue: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to change' });
