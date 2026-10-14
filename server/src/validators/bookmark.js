import { z } from 'zod';
import { objectId, paginationFields } from './common.js';

export const myBookmarksQuery = z.object({
  ...paginationFields(20, 50),
  course: objectId.optional(),
});
