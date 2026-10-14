import { z } from 'zod';

export const confirmCashSchema = z.object({
  receiptNo: z.string().trim().max(60).optional(),
});

export const rejectCashSchema = z.object({
  reason: z.string().trim().min(3, 'Give a short reason').max(300),
});
