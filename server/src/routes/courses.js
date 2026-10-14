import { Router } from 'express';
import { listCourses, listCategories, getCourse } from '../controllers/courseController.js';
import { listLessons } from '../controllers/lessonController.js';
import { enroll } from '../controllers/enrollmentController.js';
import { claimCertificate } from '../controllers/certificateController.js';
import { requireFreeCourse } from '../controllers/paymentController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listCoursesQuery } from '../validators/course.js';
import { claimCertificateSchema } from '../validators/certificate.js';

// Public / student side. Teachers manage content under /api/teacher.
const router = Router();

router.get('/', optionalAuth, validate(listCoursesQuery, 'query'), listCourses);
// "categories" must stay above "/:id", or it would be read as a course id
router.get('/categories', listCategories);
router.get('/:id', optionalAuth, getCourse);
// Paid courses are joined through /api/payments/checkout, not this route
router.post('/:id/enroll', protect, authorize('student'), requireFreeCourse, enroll);
router.post('/:courseId/certificate', protect, authorize('student'), validate(claimCertificateSchema), claimCertificate);
router.get('/:courseId/lessons', protect, listLessons);

export default router;
