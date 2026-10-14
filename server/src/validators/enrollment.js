import { z } from 'zod';
import { paginationFields } from './common.js';

export const myEnrollmentsQuery = z.object({
  ...paginationFields(10, 50),
  status: z.enum(['in_progress', 'completed']).optional(),
  q: z.string().trim().max(100).optional(),
});