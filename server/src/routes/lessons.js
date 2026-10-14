import { Router } from 'express';
import { getLesson } from '../controllers/lessonController.js';
import { markComplete, markIncomplete } from '../controllers/enrollmentController.js';
import { addBookmark, removeBookmark } from '../controllers/bookmarkController.js';
import { getQuiz, submitAttempt } from '../controllers/quizController.js';
import { getNote, saveNote, deleteNote } from '../controllers/noteController.js';
import { listQuestions, createQuestion } from '../controllers/discussionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { contentLimiter } from '../middleware/rateLimiters.js';
import { submitAttemptSchema } from '../validators/quiz.js';
import { saveNoteSchema } from '../validators/note.js';
import { listQuestionsQuery, createQuestionSchema } from '../validators/discussion.js';

// Public / student side. Teachers edit lessons under /api/teacher/lessons.
const router = Router();

router.get('/:id', protect, getLesson);
router.post('/:id/complete', protect, authorize('student'), markComplete);
router.delete('/:id/complete', protect, authorize('student'), markIncomplete);
router.post('/:id/bookmark', protect, authorize('student'), addBookmark);
router.delete('/:id/bookmark', protect, authorize('student'), removeBookmark);

// Quiz (students only; the teacher edits it under /api/teacher/lessons/:id/quiz)
router.get('/:id/quiz', protect, authorize('student'), getQuiz);
router.post('/:id/quiz/attempts', protect, authorize('student'), validate(submitAttemptSchema), submitAttempt);

// My private note on this lesson
router.get('/:id/note', protect, authorize('student'), getNote);
router.put('/:id/note', protect, authorize('student'), validate(saveNoteSchema), saveNote);
router.delete('/:id/note', protect, authorize('student'), deleteNote);

// Discussion / Q&A: enrolled students AND the course's teacher (checked in the controller)
router.get('/:id/questions', protect, validate(listQuestionsQuery, 'query'), listQuestions);
router.post('/:id/questions', protect, contentLimiter, validate(createQuestionSchema), createQuestion);

export default router;
