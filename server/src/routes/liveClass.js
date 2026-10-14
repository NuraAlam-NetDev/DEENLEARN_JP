import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { liveClassSchema } from '../validators/liveClass.js';
import { createLiveClass, listTeacherLiveClasses, deleteLiveClass, studentLiveClasses } from '../controllers/liveClassController.js';

const router = Router();

router.post('/teacher/live-classes', protect, authorize('teacher'), validate(liveClassSchema), createLiveClass);
router.get('/teacher/live-classes', protect, authorize('teacher'), listTeacherLiveClasses);
router.delete('/teacher/live-classes/:id', protect, authorize('teacher'), deleteLiveClass);
router.get('/live-classes/upcoming', protect, authorize('student'), studentLiveClasses);

export default router;
