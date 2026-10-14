import { z } from 'zod';
import { paginationFields } from './common.js';

const status = z.enum(['all', 'unanswered']);

export const listQuestionsQuery = z.object({
  ...paginationFields(10, 50),
  status: status.default('all'),
});

// Teacher inbox: what still needs an answer, by default
export const courseQuestionsQuery = z.object({
  ...paginationFields(10, 50),
  status: status.default('unanswered'),
});

export const createQuestionSchema = z.object({
  title: z.string().trim().min(3, 'Write a short title (at least 3 characters)').max(150),
  body: z.string().trim().max(3000, 'Details can be at most 3000 characters').default(''),
});

export const createReplySchema = z.object({
  body: z.string().trim().min(1, 'Write something first').max(3000, 'A reply can be at most 3000 characters'),
});

export const acceptReplySchema = z.object({ accepted: z.boolean() });
