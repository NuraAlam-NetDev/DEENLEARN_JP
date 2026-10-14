import { z } from 'zod';
import { objectId } from './common.js';

export const bulkEmailSchema = z
  .object({
    audience: z.enum(['students', 'course']),
    courseId: objectId.optional(),
    subject: z.string().trim().min(3, 'Subject is too short').max(150),
    body: z.string().trim().min(10, 'Message is too short').max(5000),
  })
  .refine((v) => v.audience !== 'course' || v.courseId, { message: 'Choose a course', path: ['courseId'] });

export const monthQuery = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use the form 2026-10').optional(),
});
