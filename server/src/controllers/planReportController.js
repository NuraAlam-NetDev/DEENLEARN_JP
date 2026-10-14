import Plan from '../models/Plan.js';
import Course from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta } from '../utils/pagination.js';
import { paidSoFar, remainingOf, nextInstallment, GRACE_DAYS, overdueInstallments } from '../services/plans.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SCAN = 500; // plans with a balance are listed up to this many; the overdue filter is applied to them

// Status of one installment for the screens
function statusOf(e, grace, now) {
  if (e.paid >= e.amount) return 'paid';
  if (now.getTime() > new Date(e.dueAt).getTime() + grace) return 'overdue';
  return e.paid > 0 ? 'partial' : 'due';
}

// GET /api/plans?status=owing|overdue&page=&limit=
// Admins see every plan. Teachers see only the plans of their own courses.
export const planReport = asyncHandler(async (req, res) => {
  const { status = 'owing', page, limit } = req.query;
  const filter = {
    $expr: { $lt: [{ $sum: '$schedule.paid' }, '$total'] }, // only plans that still owe money
  };
  if (req.user.role === 'teacher') {
    const own = await Course.find({ teacher: req.user._id }).distinct('_id');
    filter.course = { $in: own };
  }

  const plans = await Plan.find(filter)
    .sort({ updatedAt: -1 })
    .limit(MAX_SCAN)
    .populate('student', 'name email')
    .populate('course', 'title')
    .lean();

  const now = new Date();
  let rows = plans.map((p) => {
    const grace = (p.graceDays ?? GRACE_DAYS) * DAY_MS;
    const overdue = overdueInstallments(p, now);
    const next = nextInstallment(p);
    const schedule = p.schedule.map((e) => ({
      no: e.no, amount: e.amount, paid: e.paid, dueAt: e.dueAt,
      status: statusOf(e, grace, now),
      graceEnds: new Date(new Date(e.dueAt).getTime() + grace),
    }));
    return {
      _id: p._id,
      accessMode: p.accessMode,
      graceDays: p.graceDays,
      emailOnOverdue: p.emailOnOverdue !== false,
      waivedTotal: p.waivedTotal || 0,
      student: p.student ? { _id: p.student._id, name: p.student.name, email: p.student.email } : null,
      course: p.course ? { _id: p.course._id, title: p.course.title } : null,
      currency: p.currency,
      total: p.total,
      paid: paidSoFar(p),
      remaining: remainingOf(p),
      nextDue: next ? { no: next.no, owed: next.amount - next.paid, dueAt: next.dueAt, graceEnds: new Date(new Date(next.dueAt).getTime() + grace) } : null,
      overdue: overdue.length > 0,
      schedule,
    };
  });

  if (status === 'overdue') rows = rows.filter((r) => r.overdue);

  const total = rows.length;
  const size = Number(limit) || 20;
  const start = ((Number(page) || 1) - 1) * size;
  res.json({ plans: rows.slice(start, start + size), ...pageMeta(page, limit, total) });
});
