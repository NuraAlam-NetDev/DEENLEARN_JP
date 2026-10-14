import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';
import { canManage, getProgressSummary } from '../services/courseAccess.js';
import { attachCounts } from '../services/courseStats.js';

// Adds lessonCount / studentCount, and (for a logged-in user) enrolled + progress
async function decorate(courses, user) {
  await attachCounts(courses);

  const mine = new Map();
  if (user && courses.length) {
    const rows = await Enrollment.find({
      student: user._id,
      course: { $in: courses.map((c) => c._id) },
    })
      .select('course progress')
      .lean();
    rows.forEach((r) => mine.set(String(r.course), r.progress));
  }
  for (const c of courses) {
    c.enrolled = mine.has(String(c._id));
    if (c.enrolled) c.progress = mine.get(String(c._id));
  }
  return courses;
}

// Published courses, most enrolled first (ties: newest first), with the same filters and paging
async function findPopular(filter, page, limit) {
  const courses = await Course.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: Enrollment.collection.name,
        let: { id: '$_id' },
        pipeline: [{ $match: { $expr: { $eq: ['$course', '$$id'] } } }, { $count: 'n' }],
        as: 'enr',
      },
    },
    { $addFields: { enrolledCount: { $ifNull: [{ $arrayElemAt: ['$enr.n', 0] }, 0] } } },
    { $sort: { enrolledCount: -1, createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $project: { enr: 0, enrolledCount: 0 } },
  ]);
  return Course.populate(courses, { path: 'teacher', select: 'name' });
}

// GET /api/courses?q=&category=&sort=newest|popular&page=&limit=   (public: published only)
// q matches part of a word in the title or description (case-insensitive).
export const listCourses = asyncHandler(async (req, res) => {
  const { page, limit, category, q, sort } = req.query;

  const filter = { published: true };
  if (category) filter.category = category;
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const [courses, total] = await Promise.all([
    sort === 'popular'
      ? findPopular(filter, page, limit)
      : Course.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('teacher', 'name')
          .lean(),
    Course.countDocuments(filter),
  ]);
  await decorate(courses, req.user);

  res.json({ courses, ...pageMeta(page, limit, total) });
});

// GET /api/courses/categories   categories of published courses, biggest first
export const listCategories = asyncHandler(async (_req, res) => {
  const rows = await Course.aggregate([
    { $match: { published: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);
  res.json({ categories: rows.map((r) => ({ category: r._id, count: r.count })) });
});

// GET /api/courses/:id  (details + lesson outline, no lesson content)
export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('teacher', 'name');
  if (!course) throw httpError(404, 'Course not found');

  const manage = canManage(req.user, course);
  const enrollment = req.user
    ? await Enrollment.findOne({ student: req.user._id, course: course._id }).lean()
    : null;

  // Drafts are visible only to the teacher (and students already enrolled)
  if (!course.published && !manage && !enrollment) throw httpError(404, 'Course not found');

  const lessons = await Lesson.find({ course: course._id })
    .select('title order')
    .sort({ order: 1 })
    .lean();

  let enrollmentInfo = null;
  if (enrollment) {
    const summary = await getProgressSummary(req.user._id, course._id);
    enrollmentInfo = { ...summary, enrolledAt: enrollment.createdAt };
  }

  res.json({ course, lessons, canManage: manage, enrollment: enrollmentInfo });
});
