import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { myQuizAttempts } from '../controllers/quizHistoryController.js';

const router = Router();

router.get('/quiz-attempts/mine', protect, authorize('student'), myQuizAttempts);

export default router;
