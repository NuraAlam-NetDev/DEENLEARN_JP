import { z } from 'zod';
import { objectId, paginationFields } from './common.js';

// An empty string is allowed: saving an empty note deletes it
export const saveNoteSchema = z.object({
  content: z.string().trim().max(8000, 'A note can be at most 8000 characters'),
});

export const myNotesQuery = z.object({
  ...paginationFields(20, 50),
  course: objectId.optional(),
  q: z.string().trim().max(100).optional(),
});
