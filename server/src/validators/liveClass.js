import { z } from 'zod';
import { objectId } from './common.js';

export const liveClassSchema = z.object({
  courseId: objectId,
  title: z.string().trim().min(3, 'Title is too short').max(120),
  startsAt: z.coerce.date(),
  durationMin: z.coerce.number().int().min(5).max(300).default(60),
  joinUrl: z.string().trim().url('Enter a full link').regex(/^https:\/\//, 'The link must start with https://').max(500),
});
