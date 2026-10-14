import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import Bookmark from '../models/Bookmark.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { findCourseOr404, hasCourseAccess } from '../services/courseAccess.js';
import { sanitizeRichText } from '../utils/sanitizeRichText.js';

async function requireAccess(user, course) {
  if (!(await hasCourseAccess(user, course))) {
    throw httpError(403, 'Enroll in this course to view its lessons');
  }
}

// GET /api/courses/:courseId/lessons  (course title + outline with completed / bookmarked flags, no content)
export const listLessons = asyncHandler(async (req, res) => {
  const course = await findCourseOr404(req.params.courseId);
  await requireAccess(req.user, course);

  const mine = { student: req.user._id, course: course._id };
  const [lessons, doneRows, bookmarkRows] = await Promise.all([
    Lesson.find({ course: course._id }).select('-content').sort({ order: 1, _id: 1 }).lean(),
    Progress.find({ ...mine, completed: true }).select('lesson').lean(),
    Bookmark.find(mine).select('lesson').lean(),
  ]);
  const done = new Set(doneRows.map((p) => String(p.lesson)));
  const saved = new Set(bookmarkRows.map((b) => String(b.lesson)));
  for (const l of lessons) {
    l.completed = done.has(String(l._id));
    l.bookmarked = saved.has(String(l._id));
  }

  res.json({ course: { _id: course._id, title: course.title }, lessons });
});

// GET /api/lessons/:id  (full lesson + previous / next lesson for navigation)
export const getLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).lean();
  if (!lesson) throw httpError(404, 'Lesson not found');

  const course = await findCourseOr404(lesson.course);
  await requireAccess(req.user, course);

  const here = { course: lesson.course };
  const [completed, bookmarked, prevLesson, nextLesson] = await Promise.all([
    Progress.exists({ student: req.user._id, lesson: lesson._id, completed: true }),
    Bookmark.exists({ student: req.user._id, lesson: lesson._id }),
    Lesson.findOne({
      ...here,
      $or: [
        { order: { $lt: lesson.order } },
        { order: lesson.order, _id: { $lt: lesson._id } },
      ],
    })
      .sort({ order: -1, _id: -1 })
      .select('title')
      .lean(),
    Lesson.findOne({
      ...here,
      $or: [
        { order: { $gt: lesson.order } },
        { order: lesson.order, _id: { $gt: lesson._id } },
      ],
    })
      .sort({ order: 1, _id: 1 })
      .select('title')
      .lean(),
  ]);

  // Defence in depth: HTML is sanitized when a teacher saves it, but lessons saved before that
  // existed may not be. Plain-text lessons are left alone (the client escapes them).
  if (/^\s*</.test(lesson.content || '')) lesson.content = sanitizeRichText(lesson.content);

  res.json({ lesson, completed: !!completed, bookmarked: !!bookmarked, prevLesson, nextLesson });
});
