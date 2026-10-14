import { z } from 'zod';

// Only http(s): z.string().url() alone would accept "javascript:..." links
export const httpUrl = z
  .string()
  .trim()
  .url('Invalid URL')
  .max(2048)
  .refine((u) => /^https?:\/\//i.test(u), 'URL must start with http:// or https://');

export const optionalUrl = z.union([z.literal(''), httpUrl]);

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const atLeastOneField = [
  (obj) => Object.keys(obj).length > 0,
  { message: 'Provide at least one field to update' },
];
// Spread into a z.object({ ...paginationFields(10, 50), ... }) for list endpoints
export const paginationFields = (defaultLimit = 10, maxLimit = 100) => ({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
});