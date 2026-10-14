import { z } from 'zod';
import { objectId, paginationFields } from './common.js';

export const studentListQuery = z.object({
  ...paginationFields(20, 100),
  courseId: objectId.optional(),
  q: z.string().trim().max(100).optional(),
});
