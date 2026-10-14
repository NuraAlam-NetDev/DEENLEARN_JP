import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';
import { calcPercent } from '../utils/progress.js';
import { buildStudentReport } from '../services/studentReport.js';

// Who may see which students:
//   teacher -> students enrolled in the teacher's own courses
//   admin / super admin -> every student (scope = null)
const teacherScope = async (req) =>
  (await Course.find({ teacher: req.user._id }).distinct('_id')).map(String);
const adminScope = async () => null;

// One row per (student, course) enrollment, with progress and quiz numbers
async function listStudents(req, res, scopeOf) {
  const { page, limit, courseId, q } = req.query;
  const allowed = await scopeOf(req);
  if (courseId && allowed && !allowed.includes(String(courseId))) {
    throw httpError(404, 'Course not found');
  }
  const courseIds = courseId ? [String(courseId)] : allowed;

  const filter = {};
  if (courseIds) filter.course = { $in: courseIds };
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    const users = await User.find({ role: 'student', $or: [{ name: rx }, { email: rx }] })
      .select('_id')
      .limit(500)
      .lean();
    filter.student = { $in: users.map((u) => u._id) };
  }

  const [rows, total] = await Promise.all([
    Enrollment.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'name email')
      .populate('course', 'title')
      .lean(),
    Enrollment.countDocuments(filter),
  ]);
  const items = rows.filter((r) => r.student && r.course);

  // Numbers for these rows only (one query per kind, not one per student)
  const courseIdList = items.map((r) => r.course._id);
  const studentIdList = items.map((r) => r.student._id);
  const [lessonRows, doneRows, passRows] = await Promise.all([
    Lesson.aggregate([
      { $match: { course: { $in: courseIdList } } },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]),
    Progress.aggregate([
      { $match: { completed: true, course: { $in: courseIdList }, student: { $in: studentIdList } } },
      { $group: { _id: { s: '$student', c: '$course' }, n: { $sum: 1 } } },
    ]),
    QuizAttempt.aggregate([
      { $match: { passed: true, course: { $in: courseIdList }, student: { $in: studentIdList } } },
      { $group: { _id: { s: '$student', c: '$course' }, quizzes: { $addToSet: '$quiz' } } },
    ]),
  ]);

  const totals = new Map(lessonRows.map((r) => [String(r._id), r.n]));
  const dones = new Map(doneRows.map((r) => [`${r._id.s}|${r._id.c}`, r.n]));
  const passes = new Map(passRows.map((r) => [`${r._id.s}|${r._id.c}`, r.quizzes.length]));

  const students = items.map((r) => {
    const key = `${r.student._id}|${r.course._id}`;
    const totalLessons = totals.get(String(r.course._id)) ?? 0;
    const completedLessons = dones.get(key) ?? 0;
    return {
      studentId: String(r.student._id),
      name: r.student.name,
      email: r.student.email,
      courseId: String(r.course._id),
      courseTitle: r.course.title,
      totalLessons,
      completedLessons,
      progress: calcPercent(completedLessons, totalLessons),
      quizzesPassed: passes.get(key) ?? 0,
      enrolledAt: r.createdAt,
      lastActivityAt: r.updatedAt,
    };
  });

  res.json({ students, ...pageMeta(page, limit, total) });
}

// One student's full report, limited to what this viewer may see
async function studentDetail(req, res, scopeOf) {
  const allowed = await scopeOf(req);
  const data = await buildStudentReport({ studentId: req.params.studentId, courseIds: allowed });
  if (!data) throw httpError(404, 'Student not found');
  res.json(data);
}

export const teacherStudents = asyncHandler((req, res) => listStudents(req, res, teacherScope));
export const teacherStudentReport = asyncHandler((req, res) => studentDetail(req, res, teacherScope));
export const adminStudents = asyncHandler((req, res) => listStudents(req, res, adminScope));
export const adminStudentReport = asyncHandler((req, res) => studentDetail(req, res, adminScope));
