import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { teacherEarnings, teacherRemind } from '../controllers/teacherMoneyController.js';

// Teacher's own money and reminders. Each query only touches the teacher's own courses.
const router = Router();

router.get('/teacher/earnings', protect, authorize('teacher'), teacherEarnings);
router.post('/teacher/plans/:planId/remind', protect, authorize('teacher'), teacherRemind);

export default router;
