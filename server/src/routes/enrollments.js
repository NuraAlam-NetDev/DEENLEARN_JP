import { Router } from 'express';
import { myEnrollments, mySummary, courseProgress } from '../controllers/enrollmentController.js';
import { myReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { myEnrollmentsQuery } from '../validators/enrollment.js';

const router = Router();
router.use(protect, authorize('student'));

router.get('/mine', validate(myEnrollmentsQuery, 'query'), myEnrollments);
router.get('/summary', mySummary);
router.get('/report', myReport);
router.get('/:courseId/progress', courseProgress);

export default router;
