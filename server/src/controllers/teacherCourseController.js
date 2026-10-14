import Course from '../models/Course.js';
import PriceChange from '../models/PriceChange.js';
import { applyPriceChangeToPlans } from '../services/priceChange.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';
import { attachCounts } from '../services/courseStats.js';
import { uploadFile, deleteAssets } from '../services/media.js';
import { deleteCourseCascade } from '../services/courseCleanup.js';
import { slugify } from '../utils/slug.js';

// GET /api/teacher/courses?page=&limit=&status=published|draft&q=
export const listMyCourses = asyncHandler(async (req, res) => {
  const { page, limit, status, q } = req.query;

  const filter = { teacher: req.user._id };
  if (status === 'published') filter.published = true;
  if (status === 'draft') filter.published = false;
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);
  await attachCounts(courses);

  res.json({ courses, ...pageMeta(page, limit, total) });
});

// GET /api/teacher/courses/:id
export const getMyCourse = asyncHandler(async (req, res) => {
  const course = req.course.toObject();
  await attachCounts([course]);
  res.json({ course });
});

// POST /api/teacher/courses  (always created as a draft)
export const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create({ ...req.body, teacher: req.user._id, published: false });
  res.status(201).json({ course });
});

// PATCH /api/teacher/courses/:id
export const updateCourse = asyncHandler(async (req, res) => {
  const course = req.course;
  const replacedUpload =
    req.body.thumbnail !== undefined && course.thumbnailPublicId
      ? { publicId: course.thumbnailPublicId, resourceType: 'image' }
      : null;

  const before = { JPY: course.priceJPY, USD: course.priceUSD };
  Object.assign(course, req.body); // body is whitelisted by the Zod schema
  if (replacedUpload) course.thumbnailPublicId = '';
  await course.save();

  // Keep a record of every price change (for the admin price report)
  const after = { JPY: course.priceJPY, USD: course.priceUSD };
  for (const currency of ['JPY', 'USD']) {
    if (before[currency] !== undefined && after[currency] !== before[currency]) {
      await PriceChange.create({
        course: course._id,
        currency,
        from: before[currency],
        to: after[currency],
        changedBy: req.user._id,
        changedByRole: req.user.role,
      });
      // students who still owe money on this course pay the difference (or get it back on their balance)
      await applyPriceChangeToPlans({ courseId: course._id, currency, from: before[currency], to: after[currency] });
    }
  }

  // thumbnail URL was replaced by a plain link: drop the old uploaded file
  if (replacedUpload) await deleteAssets([replacedUpload]);
  res.json({ course });
});

// DELETE /api/teacher/courses/:id  (also removes lessons, enrollments, progress, uploaded files)
export const deleteCourse = asyncHandler(async (req, res) => {
  await deleteCourseCascade(req.course);
  res.json({ message: 'Course deleted' });
});

// PATCH /api/teacher/courses/:id/publish
export const publishCourse = asyncHandler(async (req, res) => {
  const lessonCount = await Lesson.countDocuments({ course: req.course._id });
  if (!lessonCount) throw httpError(400, 'Add at least one lesson before publishing');

  req.course.published = true;
  await req.course.save();
  res.json({ course: req.course });
});

// PATCH /api/teacher/courses/:id/unpublish
export const unpublishCourse = asyncHandler(async (req, res) => {
  req.course.published = false;
  await req.course.save();
  res.json({ course: req.course });
});

// POST /api/teacher/courses/:id/thumbnail   (multipart, field "file", image only)
export const uploadThumbnail = asyncHandler(async (req, res) => {
  const course = req.course;
  const file = await uploadFile(req.file, {
    folder: `deenlearn/courses/${slugify(course.title)}-${course._id}/thumbnails`,
    allow: ['image'],
  });

  const old = course.thumbnailPublicId
    ? { publicId: course.thumbnailPublicId, resourceType: 'image' }
    : null;

  try {
    course.thumbnail = file.url;
    course.thumbnailPublicId = file.publicId;
    await course.save();
  } catch (err) {
    await deleteAssets([file]); // don't leave an orphan in Cloudinary
    throw err;
  }

  if (old) await deleteAssets([old]);
  res.json({ course });
});

// DELETE /api/teacher/courses/:id/thumbnail
export const deleteThumbnail = asyncHandler(async (req, res) => {
  const course = req.course;
  const old = course.thumbnailPublicId
    ? { publicId: course.thumbnailPublicId, resourceType: 'image' }
    : null;

  course.thumbnail = '';
  course.thumbnailPublicId = '';
  await course.save();

  if (old) await deleteAssets([old]);
  res.json({ course });
});

// GET /api/teacher/courses/:id/stats
// { stats: { lessons, students, completed, avgProgress, newLast7Days, perLesson: [{ _id, title, order, completions }] } }
export const getCourseStats = asyncHandler(async (req, res) => {
  const courseId = req.course._id;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [lessons, enrollmentRows, doneRows] = await Promise.all([
    Lesson.find({ course: courseId }).select('title order').sort({ order: 1 }).lean(),
    Enrollment.aggregate([
      { $match: { course: courseId } },
      {
        $group: {
          _id: null,
          students: { $sum: 1 },
          avgProgress: { $avg: '$progress' },
          completed: { $sum: { $cond: [{ $gte: ['$progress', 100] }, 1, 0] } },
          newLast7Days: { $sum: { $cond: [{ $gte: ['$createdAt', weekAgo] }, 1, 0] } },
        },
      },
    ]),
    Progress.aggregate([
      { $match: { course: courseId, completed: true } },
      { $group: { _id: '$lesson', n: { $sum: 1 } } },
    ]),
  ]);

  const totals = enrollmentRows[0] || { students: 0, avgProgress: 0, completed: 0, newLast7Days: 0 };
  const done = new Map(doneRows.map((r) => [String(r._id), r.n]));

  res.json({
    stats: {
      lessons: lessons.length,
      students: totals.students,
      completed: totals.completed,
      avgProgress: Math.round(totals.avgProgress || 0),
      newLast7Days: totals.newLast7Days,
      perLesson: lessons.map((l) => ({
        _id: l._id,
        title: l.title,
        order: l.order,
        completions: done.get(String(l._id)) ?? 0,
      })),
    },
  });
});