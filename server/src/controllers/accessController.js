import mongoose from 'mongoose';
import AccessRequest from '../models/AccessRequest.js';
import Plan from '../models/Plan.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta } from '../utils/pagination.js';
import { notify } from '../utils/notify.js';
import { planFor, remainingOf } from '../services/plans.js';
import { notifyStaff } from '../utils/notify.js';

// POST /api/access-requests  body: { courseId, reason? }
// - Student with an installment plan that still owes money  -> type 'access' (free access to the lessons)
// - Student who has not bought a paid course                 -> type 'enrollment' (join it for free)
export const requestFreeAccess = asyncHandler(async (req, res) => {
  const { courseId, reason } = req.body;
  const course = await Course.findById(courseId).select('published priceJPY priceUSD').lean();
  if (!course || !course.published) throw httpError(404, 'Course not found');

  const plan = await planFor(req.user._id, courseId);
  let type;
  if (plan) {
    if (remainingOf(plan) <= 0) throw httpError(400, 'This course is already paid in full');
    if (plan.accessMode === 'free') throw httpError(409, 'You already have free access to this course');
    type = 'access';
  } else {
    throw httpError(400, 'Buy the course to enroll. Free enrollment is not available.');
  }

  const pending = await AccessRequest.exists({ student: req.user._id, course: courseId, status: 'pending' });
  if (pending) throw httpError(409, 'Your request is already waiting for an answer');

  const request = await AccessRequest.create({ student: req.user._id, course: courseId, type, reason });
  await notifyStaff(['admin', 'super_admin'], {
    type: 'access',
    title: type === 'enrollment' ? 'Free enrollment request' : 'Free-access request',
    body: `A student asked for ${type === 'enrollment' ? 'free enrollment' : 'free access'} in a course.`,
    link: '/admin/access-requests',
  });
  res.status(201).json({ request });
});

// GET /api/access-requests?status=pending|approved|rejected|all&page=&limit=  (admins and the super admin)
export const listAccessRequests = asyncHandler(async (req, res) => {
  const { status = 'pending', page, limit } = req.query;
  const filter = status === 'all' ? {} : { status };
  const [rows, total] = await Promise.all([
    AccessRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('decidedBy', 'name role')
      .lean(),
    AccessRequest.countDocuments(filter),
  ]);
  res.json({ requests: rows, ...pageMeta(page, limit, total) });
});

// PATCH /api/access-requests/:id  body: { decision: 'approve'|'reject', note? }
export const decideAccessRequest = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid request');
  const request = await AccessRequest.findById(req.params.id);
  if (!request) throw httpError(404, 'Request not found');
  if (request.status !== 'pending') throw httpError(400, 'This request was already answered');

  const approve = req.body.decision === 'approve';
  if (approve) {
    if (request.type === 'enrollment') {
      // Joined for free: no payment and no plan. The student is enrolled directly.
      try {
        await Enrollment.create({ student: request.student, course: request.course });
      } catch (err) {
        if (err.code !== 11000) throw err; // already enrolled: fine
      }
    } else {
      const plan = await Plan.findOne({ student: request.student, course: request.course });
      if (!plan) throw httpError(400, 'The student has no payment plan for this course any more');
      plan.accessMode = 'free';
      plan.policyBy = req.user._id;
      plan.policyAt = new Date();
      await plan.save();
    }
  }

  request.status = approve ? 'approved' : 'rejected';
  request.decidedBy = req.user._id;
  request.decidedAt = new Date();
  request.decisionNote = req.body.note || '';
  await request.save();

  const isEnrollment = request.type === 'enrollment';
  await notify(request.student, {
    type: 'payment',
    title: approve
      ? (isEnrollment ? 'You are enrolled' : 'Free access approved')
      : (isEnrollment ? 'Enrollment request not approved' : 'Free access request not approved'),
    body: approve
      ? (isEnrollment ? 'Your request was approved. The course is now open for you.' : 'Your request was approved. You can study the course now.')
      : `Your request was not approved.${request.decisionNote ? ` Note: ${request.decisionNote}` : ''}`,
    link: '/student/courses',
    email: true,
    kind: 'payment',
  });
  res.json({ ok: true, status: request.status });
});
