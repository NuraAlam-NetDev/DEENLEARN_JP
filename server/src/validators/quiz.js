import { z } from 'zod';
import { objectId, paginationFields } from './common.js';

const optionSchema = z.object({
  _id: objectId.optional(), // sent back when editing, so existing option ids (and attempt history) stay valid
  text: z.string().trim().min(1, 'Option text is required').max(300, 'Option text is too long'),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z
  .object({
    _id: objectId.optional(),
    text: z.string().trim().min(1, 'Question text is required').max(1000, 'Question is too long'),
    explanation: z.string().trim().max(1000).default(''),
    options: z
      .array(optionSchema)
      .min(2, 'Each question needs at least 2 options')
      .max(6, 'A question can have at most 6 options'),
  })
  .refine((q) => q.options.some((o) => o.isCorrect), {
    message: 'Mark at least one option as correct',
    path: ['options'],
  });

// PUT /api/teacher/lessons/:id/quiz  (the whole quiz is sent each time)
export const saveQuizSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(150).default('Quiz'),
    passingScore: z.number().int().min(0).max(100).default(70),
    published: z.boolean().default(false),
    required: z.boolean().default(false),
    questions: z.array(questionSchema).max(40, 'A quiz can have at most 40 questions').default([]),
  })
  .superRefine((quiz, ctx) => {
    if (quiz.published && quiz.questions.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['questions'], message: 'Add at least one question before publishing' });
    }
    // reused ids would make two questions / options indistinguishable
    const seen = new Set();
    const note = (id, path) => {
      if (!id) return;
      if (seen.has(id)) ctx.addIssue({ code: 'custom', path, message: 'Duplicate id' });
      seen.add(id);
    };
    quiz.questions.forEach((q, qi) => {
      note(q._id, ['questions', qi, '_id']);
      q.options.forEach((o, oi) => note(o._id, ['questions', qi, 'options', oi, '_id']));
    });
  });

// POST /api/lessons/:id/quiz/attempts
export const submitAttemptSchema = z.object({
  answers: z
    .array(z.object({ question: objectId, selected: z.array(objectId).max(6) }))
    .max(40),
});

export const quizResultsQuery = z.object({ ...paginationFields(20, 100) });
