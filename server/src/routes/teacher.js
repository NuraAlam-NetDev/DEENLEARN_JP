import { Router } from 'express';
import { auditChanges } from '../middleware/audit.js';
import { listCashOrders, confirmCash, rejectCash } from '../controllers/cashController.js';
import { confirmCashSchema, rejectCashSchema } from '../validators/cash.js';
import { teacherStudents, teacherStudentReport } from '../controllers/studentProgressController.js';
import { studentListQuery } from '../validators/progress.js';
import { protect, authorize, requireApprovedTeacher } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loadOwnedCourse, loadOwnedLesson } from '../middleware/ownership.js';
import { uploadSingle, requireUploads, validateUpload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';
import {
  listMyCourses, getMyCourse, createCourse, updateCourse, deleteCourse,
  publishCourse, unpublishCourse, uploadThumbnail, deleteThumbnail, getCourseStats,
} from '../controllers/teacherCourseController.js';
import {
  listCourseLessons, getLesson, createLesson, updateLesson, deleteLesson,
  reorderLessons, addAttachment, removeAttachment,
} from '../controllers/teacherLessonController.js';
import {
  getQuiz as getLessonQuiz, saveQuiz, deleteQuiz, getQuizResults,
} from '../controllers/teacherQuizController.js';
import { listCourseQuestions } from '../controllers/discussionController.js';
import {
  createCourseSchema, updateCourseSchema, teacherListCoursesQuery,
} from '../validators/course.js';
import { saveQuizSchema, quizResultsQuery } from '../validators/quiz.js';
import { courseQuestionsQuery } from '../validators/discussion.js';
import {
  createLessonSchema, updateLessonSchema, reorderLessonsSchema, teacherListLessonsQuery,
} from '../validators/lesson.js';

const router = Router();

// Everything below: logged-in, admin-approved teachers only. Ownership is checked per course/lesson.
router.use(protect, authorize('teacher'), requireApprovedTeacher, auditChanges);

const ownCourse = loadOwnedCourse('id');
const ownCourseByCourseId = loadOwnedCourse('courseId');
const uploadChain = [uploadLimiter, requireUploads, uploadSingle, validateUpload(['image', 'pdf', 'audio'])];

// ---- Courses ----
router.get('/courses', validate(teacherListCoursesQuery, 'query'), listMyCourses);
router.post('/courses', validate(createCourseSchema), createCourse);
router.get('/courses/:id', ownCourse, getMyCourse);
router.patch('/courses/:id', ownCourse, validate(updateCourseSchema), updateCourse);
router.delete('/courses/:id', ownCourse, deleteCourse);

router.get('/courses/:id/stats', ownCourse, getCourseStats);

// Students' questions across the whole course (the teacher's inbox)
router.get('/courses/:id/questions', ownCourse, validate(courseQuestionsQuery, 'query'), listCourseQuestions);

router.patch('/courses/:id/publish', ownCourse, publishCourse);
router.patch('/courses/:id/unpublish', ownCourse, unpublishCourse);

router.post('/courses/:id/thumbnail', ownCourse, ...uploadChain, uploadThumbnail);
router.delete('/courses/:id/thumbnail', ownCourse, deleteThumbnail);

// ---- Lessons of a course ----
router.get('/courses/:courseId/lessons', ownCourseByCourseId, validate(teacherListLessonsQuery, 'query'), listCourseLessons);
router.post('/courses/:courseId/lessons', ownCourseByCourseId, validate(createLessonSchema), createLesson);
router.put('/courses/:courseId/lessons/reorder', ownCourseByCourseId, validate(reorderLessonsSchema), reorderLessons);

// ---- Single lesson ----
router.get('/lessons/:id', loadOwnedLesson, getLesson);
router.patch('/lessons/:id', loadOwnedLesson, validate(updateLessonSchema), updateLesson);
router.delete('/lessons/:id', loadOwnedLesson, deleteLesson);

// ---- Lesson quiz (one per lesson) ----
router.get('/lessons/:id/quiz', loadOwnedLesson, getLessonQuiz);
router.put('/lessons/:id/quiz', loadOwnedLesson, validate(saveQuizSchema), saveQuiz);
router.delete('/lessons/:id/quiz', loadOwnedLesson, deleteQuiz);
router.get('/lessons/:id/quiz/results', loadOwnedLesson, validate(quizResultsQuery, 'query'), getQuizResults);

// ---- Lesson files (PDF / image / audio) ----
router.post('/lessons/:id/attachments', loadOwnedLesson, ...uploadChain, addAttachment);
router.delete('/lessons/:id/attachments/:attachmentId', loadOwnedLesson, removeAttachment);

// Students in my own courses
router.get('/students', validate(studentListQuery, 'query'), teacherStudents);
router.get('/students/:studentId/report', teacherStudentReport);

// Cash payments: the teacher confirms that the money arrived (or rejects it)
router.get('/cash-orders', listCashOrders);
router.patch('/cash-orders/:id/confirm', validate(confirmCashSchema), confirmCash);
router.patch('/cash-orders/:id/reject', validate(rejectCashSchema), rejectCash);

export default router;
