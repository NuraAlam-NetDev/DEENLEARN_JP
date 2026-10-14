import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import Bookmark from '../models/Bookmark.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';
import { calcPercent } from '../utils/progress.js';
import {
  findCourseOr404,
  findEnrolledLesson,
  getProgressSummary,
  getResumeLessons,
  recomputeEnrollment,
} from '../services/courseAccess.js';

// POST /api/courses/:id/enroll
// (Free for now. When payments are added, verify the payment here before creating.)
export const enroll = asyncHandler(async (req, res) => {
  const course = await findCourseOr404(req.params.id);
  if (!course.published) throw httpError(404, 'Course not found');

  try {
    const enrollment = await Enrollment.create({ student: req.user._id, course: course._id });
    res.status(201).json({ enrollment });
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'You are already enrolled in this course');
    throw err;
  }
});

// GET /api/enrollments/mine?page=&limit=&status=in_progress|completed&q=
// Most recently active course first.
export const myEnrollments = asyncHandler(async (req, res) => {
  const { page, limit, status, q } = req.query;

  const filter = { student: req.user._id };
  if (status === 'completed') filter.progress = 100;
  if (status === 'in_progress') filter.progress = { $lt: 100 };
  if (q) {
    const matches = await Course.find({ title: { $regex: escapeRegex(q), $options: 'i' } })
      .select('_id')
      .limit(500)
      .lean();
    filter.course = { $in: matches.map((c) => c._id) };
  }

  const [rows, total] = await Promise.all([
    Enrollment.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'course',
        select: 'title description category thumbnail published teacher',
        populate: { path: 'teacher', select: 'name' },
      })
      .lean(),
    Enrollment.countDocuments(filter),
  ]);

  const items = rows.filter((e) => e.course);
  const courseIds = items.map((e) => e.course._id);

  const countBy = (Model, match) =>
    Model.aggregate([
      { $match: { course: { $in: courseIds }, ...match } },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]);
  const [totalRows, doneRows] = await Promise.all([
    countBy(Lesson, {}),
    countBy(Progress, { student: req.user._id, completed: true }),
  ]);
  const totals = new Map(totalRows.map((r) => [String(r._id), r.n]));
  const dones = new Map(doneRows.map((r) => [String(r._id), r.n]));

  const resume = await getResumeLessons(req.user._id, courseIds);

  const enrollments = items.map((e) => {
    const totalLessons = totals.get(String(e.course._id)) ?? 0;
    const completedLessons = dones.get(String(e.course._id)) ?? 0;
    const where = resume.get(String(e.course._id));
    return {
      _id: e._id,
      course: e.course,
      progress: calcPercent(completedLessons, totalLessons),
      completedLessons,
      totalLessons,
      // For "continue learning": first lesson not done yet (null when finished) and the very first lesson
      nextLessonId: where?.nextLessonId ?? null,
      firstLessonId: where?.firstLessonId ?? null,
      enrolledAt: e.createdAt,
      lastActivityAt: e.updatedAt,
    };
  });

  res.json({ enrollments, ...pageMeta(page, limit, total) });
});

// GET /api/enrollments/summary
// Numbers for the dashboard + the "continue learning" target (the most recently active
// course that still has an unfinished lesson).
export const mySummary = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [enrollments, completedLessons, bookmarks] = await Promise.all([
    Enrollment.find({ student: studentId }).sort({ updatedAt: -1 }).select('course progress').lean(),
    Progress.countDocuments({ student: studentId, completed: true }),
    Bookmark.countDocuments({ student: studentId }),
  ]);

  const completedCourses = enrollments.filter((e) => e.progress === 100).length;

  // Look at a handful of recent unfinished courses; the first with a lesson left wins
  const candidates = enrollments.filter((e) => e.progress < 100).slice(0, 10);
  const resume = await getResumeLessons(
    studentId,
    candidates.map((e) => e.course)
  );
  const target = candidates.find((e) => resume.get(String(e.course))?.nextLessonId);

  let continueLearning = null;
  if (target) {
    const nextLessonId = resume.get(String(target.course)).nextLessonId;
    const [course, lesson] = await Promise.all([
      Course.findById(target.course).select('title').lean(),
      Lesson.findById(nextLessonId).select('title order').lean(),
    ]);
    if (course && lesson) {
      continueLearning = {
        courseId: course._id,
        courseTitle: course.title,
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        progress: target.progress,
      };
    }
  }

  res.json({
    enrolledCourses: enrollments.length,
    completedCourses,
    inProgressCourses: enrollments.length - completedCourses,
    completedLessons,
    bookmarks,
    continueLearning,
  });
});

// GET /api/enrollments/:courseId/progress
export const courseProgress = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  }).lean();
  if (!enrollment) throw httpError(404, 'You are not enrolled in this course');

  const summary = await getProgressSummary(req.user._id, enrollment.course);

  // self-heal: keep the stored percentage in sync with the live one
  if (summary.progress !== enrollment.progress) {
    await Enrollment.updateOne({ _id: enrollment._id }, { progress: summary.progress });
  }

  // "Continue learning": first lesson (by order) not completed yet
  const doneRows = await Progress.find({
    student: req.user._id,
    course: enrollment.course,
    completed: true,
  })
    .select('lesson')
    .lean();
  const nextLesson = await Lesson.findOne({
    course: enrollment.course,
    _id: { $nin: doneRows.map((p) => p.lesson) },
  })
    .sort({ order: 1, _id: 1 })
    .select('title order')
    .lean();

  res.json({
    courseId: enrollment.course,
    ...summary,
    isCompleted: summary.totalLessons > 0 && summary.progress === 100,
    nextLesson,
  });
});

// POST /api/lessons/:id/complete
export const markComplete = asyncHandler(async (req, res) => {
  const lesson = await findEnrolledLesson(req.user._id, req.params.id);
  const filter = { student: req.user._id, lesson: lesson._id };

  // A published quiz marked "required" must be passed first
  const gate = await Quiz.findOne({ lesson: lesson._id, published: true, required: true }).select('_id').lean();
  if (gate && !(await QuizAttempt.exists({ student: req.user._id, quiz: gate._id, passed: true }))) {
    throw httpError(400, 'Pass the quiz for this lesson before marking it complete');
  }

  const existing = await Progress.findOne(filter).select('completed').lean();
  if (!existing?.completed) {
    await Progress.findOneAndUpdate(
      filter,
      { $set: { course: lesson.course, completed: true, completedAt: new Date() } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  const summary = await recomputeEnrollment(req.user._id, lesson.course);
  res.json({ completed: true, ...summary, courseCompleted: summary.progress === 100 });
});

// DELETE /api/lessons/:id/complete
export const markIncomplete = asyncHandler(async (req, res) => {
  const lesson = await findEnrolledLesson(req.user._id, req.params.id);

  await Progress.updateOne(
    { student: req.user._id, lesson: lesson._id },
    { $set: { completed: false }, $unset: { completedAt: 1 } }
  );

  const summary = await recomputeEnrollment(req.user._id, lesson.course);
  res.json({ completed: false, ...summary, courseCompleted: false });
});
