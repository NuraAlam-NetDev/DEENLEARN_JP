import { z } from 'zod';
import { optionalUrl, atLeastOneField, paginationFields } from './common.js';

// "published" is intentionally absent: use the publish / unpublish endpoints
export const createCourseSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(150),
  description: z.string().trim().max(5000).default(''),
  category: z.string().trim().toLowerCase().min(1).max(50).default('general'),
  thumbnail: optionalUrl.default(''),
  priceJPY: z.coerce.number().int().min(0).max(1000000).default(0),
  priceUSD: z.coerce.number().int().min(0).max(10000).default(0),
});

export const updateCourseSchema = createCourseSchema.partial().refine(...atLeastOneField);

// Public catalogue
export const listCoursesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().trim().toLowerCase().max(50).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'popular']).default('newest'),
});

// Teacher dashboard
export const teacherListCoursesQuery = z.object({
  ...paginationFields(10, 50),
  status: z.enum(['published', 'draft']).optional(),
  q: z.string().trim().max(100).optional(),
});
