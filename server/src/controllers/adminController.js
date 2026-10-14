import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import RefreshToken from '../models/RefreshToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';
import { attachCounts } from '../services/courseStats.js';
import { deleteCourseCascade } from '../services/courseCleanup.js';

const DAY = 24 * 60 * 60 * 1000;

async function findUserOr404(id) {
  const user = await User.findById(id);
  if (!user) throw httpError(404, 'User not found');
  return user;
}

// GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 7 * DAY);
  const isSuper = req.user.role === 'super_admin';
  // Normal admins never see super admin accounts, not even in the numbers
  const userScope = isSuper ? {} : { role: { $ne: 'super_admin' } };

  const [
    roleRows, banned, pendingTeachers, newUsers,
    courseTotal, coursePublished,
    lessonTotal,
    enrollTotal, enrollCompleted, newEnrollments,
  ] = await Promise.all([
    User.aggregate([{ $match: userScope }, { $group: { _id: '$role', n: { $sum: 1 } } }]),
    User.countDocuments({ ...userScope, status: 'banned' }),
    User.countDocuments({ ...userScope, role: 'teacher', approvalStatus: 'pending' }),
    User.countDocuments({ ...userScope, createdAt: { $gte: since } }),
    Course.countDocuments(),
    Course.countDocuments({ published: true }),
    Lesson.countDocuments(),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ progress: 100 }),
    Enrollment.countDocuments({ createdAt: { $gte: since } }),
  ]);

  const roles = Object.fromEntries(roleRows.map((r) => [r._id, r.n]));

  res.json({
    users: {
      total: Object.values(roles).reduce((a, b) => a + b, 0),
      students: roles.student ?? 0,
      teachers: roles.teacher ?? 0,
      admins: roles.admin ?? 0,
      banned,
      pendingTeachers,
      newLast7Days: newUsers,
      // Only the super admin sees how many super admins exist
      ...(isSuper && { superAdmins: roles.super_admin ?? 0 }),
    },
    courses: {
      total: courseTotal,
      published: coursePublished,
      drafts: courseTotal - coursePublished,
    },
    lessons: { total: lessonTotal },
    enrollments: {
      total: enrollTotal,
      completed: enrollCompleted,
      newLast7Days: newEnrollments,
    },
  });
});

// GET /api/admin/users?page=&limit=&role=&status=active|banned&approval=pending|approved|rejected&q=
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, role, status, approval, q } = req.query;

  const filter = {};
  if (req.user.role === 'super_admin') {
    if (role) filter.role = role;
  } else {
    // Normal admins only see students and teachers
    filter.role = role && ['student', 'teacher'].includes(role) ? role : { $in: ['student', 'teacher'] };
  }
  if (status === 'banned') filter.status = 'banned';
  if (status === 'active') filter.status = { $ne: 'banned' }; // accounts created before this field count as active
  if (approval === 'pending' || approval === 'rejected') filter.approvalStatus = approval;
  if (approval === 'approved') filter.approvalStatus = { $nin: ['pending', 'rejected'] };
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ users, ...pageMeta(page, limit, total) });
});

// PATCH /api/admin/users/:id/ban   body: { reason? }
export const banUser = asyncHandler(async (req, res) => {
  const user = await findUserOr404(req.params.id);
  if (String(user._id) === String(req.user._id)) throw httpError(400, 'You cannot ban yourself');
  if (user.role === 'admin') throw httpError(403, 'Admin accounts cannot be banned');

  user.status = 'banned';
  user.banReason = req.body.reason ?? '';
  user.bannedAt = new Date();
  await user.save();

  // Log them out everywhere; the access token is blocked by protect() right away
  await RefreshToken.deleteMany({ user: user._id });
  // A banned teacher's courses disappear from the catalogue
  if (user.role === 'teacher') await Course.updateMany({ teacher: user._id }, { published: false });

  res.json({ user });
});

// PATCH /api/admin/users/:id/unban
export const unbanUser = asyncHandler(async (req, res) => {
  const user = await findUserOr404(req.params.id);

  user.status = 'active';
  user.banReason = '';
  user.bannedAt = undefined;
  await user.save();

  res.json({ user });
});

async function findTeacherOr400(id) {
  const user = await findUserOr404(id);
  if (user.role !== 'teacher') throw httpError(400, 'This user is not a teacher');
  return user;
}

// PATCH /api/admin/teachers/:id/approve
export const approveTeacher = asyncHandler(async (req, res) => {
  const user = await findTeacherOr400(req.params.id);

  user.approvalStatus = 'approved';
  user.rejectionReason = '';
  user.reviewedAt = new Date();
  await user.save();

  res.json({ user });
});

// PATCH /api/admin/teachers/:id/reject   body: { reason? }
export const rejectTeacher = asyncHandler(async (req, res) => {
  const user = await findTeacherOr400(req.params.id);

  user.approvalStatus = 'rejected';
  user.rejectionReason = req.body.reason ?? '';
  user.reviewedAt = new Date();
  await user.save();

  // Revoking an approved teacher: take their courses off the catalogue too
  await Course.updateMany({ teacher: user._id }, { published: false });

  res.json({ user });
});

// GET /api/admin/courses?page=&limit=&published=true|false&teacher=&q=   (drafts included)
export const listCourses = asyncHandler(async (req, res) => {
  const { page, limit, published, teacher, q } = req.query;

  const filter = {};
  if (published) filter.published = published === 'true';
  if (teacher) filter.teacher = teacher;
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('teacher', 'name email')
      .lean(),
    Course.countDocuments(filter),
  ]);
  await attachCounts(courses);

  res.json({ courses, ...pageMeta(page, limit, total) });
});

// DELETE /api/admin/courses/:id   (permanent: lessons, enrollments, progress, uploaded files)
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw httpError(404, 'Course not found');

  await deleteCourseCascade(course);
  res.json({ message: 'Course removed' });
});
// PATCH /api/admin/courses/:id/visibility   body: { published: true | false }
// Admin can hide a course from the catalogue or show it again. Admin cannot create courses.
export const setCourseVisibility = asyncHandler(async (req, res) => {
  const { published } = req.body;
  if (typeof published !== 'boolean') throw httpError(400, 'published must be true or false');

  const course = await Course.findById(req.params.id);
  if (!course) throw httpError(404, 'Course not found');

  if (published) {
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    if (!lessonCount) throw httpError(400, 'This course has no lessons yet');
  }

  course.published = published;
  await course.save();
  res.json({ course });
});