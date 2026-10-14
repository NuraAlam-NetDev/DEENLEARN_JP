import { z } from 'zod';
import { httpUrl, optionalUrl, objectId, atLeastOneField } from './common.js';
import { sanitizeRichText } from '../utils/sanitizeRichText.js';

const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: httpUrl,
  type: z.string().trim().max(100).optional(),
  size: z.number().int().min(0).optional(),
});

export const createLessonSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  content: z.string().max(200000).default('').transform(sanitizeRichText), // HTML from the editor: strip scripts etc.
  attachments: z.array(attachmentSchema).max(20).default([]),
  order: z.number().int().min(0).optional(), // omitted -> added at the end
  videoUrl: optionalUrl.default(''),
});

export const updateLessonSchema = createLessonSchema.partial().refine(...atLeastOneField);

export const reorderLessonsSchema = z.object({
  lessonIds: z.array(objectId).min(1).max(500),
});
export const teacherListLessonsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(500).default(20),

  q: z.string().trim().max(100).optional(),
});