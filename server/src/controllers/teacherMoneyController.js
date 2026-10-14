import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Order from '../models/Order.js';
import Plan from '../models/Plan.js';
import Enrollment from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { sendEmail } from '../utils/email.js';
import { remainingOf, nextInstallment, overdueInstallments } from '../services/plans.js';
import { formatMoney } from '../utils/money.js';

const MONTHS = 12;
const TZ = 'Asia/Dhaka';

// Last 12 month keys, oldest first, e.g. "2026-03"
function monthKeys(now) {
  const keys = [];
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

// GET /api/teacher/earnings  -> this teacher's courses only
export const teacherEarnings = asyncHandler(async (req, res) => {
  const now = new Date();
  const own = await Course.find({ teacher: req.user._id }).select('title').lean();
  const ownIds = own.map((c) => c._id);
  const since = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1);

  const [monthly, perCourse, cash, plans] = await Promise.all([
    Order.aggregate([
      { $match: { course: { $in: ownIds }, status: 'approved', reviewedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$reviewedAt', timezone: TZ } },
            currency: '$currency',
          },
          gross: { $sum: '$amount' },
          refunded: { $sum: '$refundedAmount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { course: { $in: ownIds }, status: 'approved' } },
      { $group: { _id: { course: '$course', currency: '$currency' }, gross: { $sum: '$amount' }, refunded: { $sum: '$refundedAmount' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { course: { $in: ownIds }, provider: 'cash', status: { $in: ['cash_pending', 'awaiting_approval'] } } },
      { $group: { _id: { status: '$status', currency: '$currency' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Plan.find({ course: { $in: ownIds }, $expr: { $lt: [{ $sum: '$schedule.paid' }, '$total'] } }).limit(5000).lean(),
  ]);

  // Monthly table: every currency, every month (zero where nothing came in)
  const keys = monthKeys(now);
  const byMonth = {};
  for (const r of monthly) {
    const k = `${r._id.currency}|${r._id.month}`;
    byMonth[k] = { gross: r.gross, refunded: r.refunded, net: r.gross - r.refunded, count: r.count };
  }
  const currencies = [...new Set(monthly.map((r) => r._id.currency))].sort();
  const months = currencies.map((c) => ({
    currency: c,
    rows: keys.map((m) => ({ month: m, ...(byMonth[`${c}|${m}`] ?? { gross: 0, refunded: 0, net: 0, count: 0 }) })),
  }));

  const titles = new Map(own.map((c) => [String(c._id), c.title]));
  const courseRows = {};
  for (const r of perCourse) {
    const id = String(r._id.course);
    courseRows[id] ??= { _id: id, title: titles.get(id) ?? '—', byCurrency: {} };
    courseRows[id].byCurrency[r._id.currency] = { net: r.gross - r.refunded, count: r.count };
  }

  const cashWaiting = {};
  for (const r of cash) {
    const cur = r._id.currency;
    cashWaiting[cur] ??= { waitingTeacher: 0, waitingAdmin: 0 };
    if (r._id.status === 'cash_pending') cashWaiting[cur].waitingTeacher += r.amount;
    else cashWaiting[cur].waitingAdmin += r.amount;
  }

  const owed = {};
  let overdueCount = 0;
  for (const p of plans) {
    owed[p.currency] = (owed[p.currency] || 0) + remainingOf(p);
    if (p.accessMode !== 'free' && overdueInstallments(p, now).length) overdueCount += 1;
  }

  const thisMonth = keys[keys.length - 1];
  res.json({
    months,
    thisMonth,
    totals: Object.fromEntries(currencies.map((c) => [c, {
      net: monthly.filter((r) => r._id.currency === c).reduce((s, r) => s + r.gross - r.refunded, 0),
      count: monthly.filter((r) => r._id.currency === c).reduce((s, r) => s + r.count, 0),
    }])),
    cashWaiting,
    owed: Object.entries(owed).map(([currency, amount]) => ({ currency, amount })),
    overdueCount,
    students: await Enrollment.countDocuments({ course: { $in: ownIds } }),
    courses: Object.values(courseRows).sort((a, b) => a.title.localeCompare(b.title)),
  });
});

// POST /api/teacher/plans/:planId/remind  -> reminder to a student of one of the teacher's own courses
export const teacherRemind = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.planId)) throw httpError(400, 'Invalid plan');
  const plan = await Plan.findById(req.params.planId).populate('student', 'name email').populate('course', 'title teacher');
  if (!plan || !plan.student || !plan.course) throw httpError(404, 'Plan not found');
  if (String(plan.course.teacher) !== String(req.user._id)) throw httpError(403, 'This is not one of your courses');

  const owed = remainingOf(plan);
  if (owed <= 0) throw httpError(400, 'Nothing is owed on this course');
  const next = nextInstallment(plan);
  const dueLine = next
    ? ` The next installment (${next.no}) is ${formatMoney(next.amount - next.paid, plan.currency)}, due ${new Date(next.dueAt).toLocaleDateString()}.`
    : '';

  await sendEmail({
    kind: 'manual',
    to: plan.student.email,
    subject: `Payment reminder: ${plan.course.title}`,
    text: `Hi ${plan.student.name},\n\nYou still owe ${formatMoney(owed, plan.currency)} for "${plan.course.title}".${dueLine}\n\nPlease pay in the app to keep access to the lessons.\n\nDeenlearn`,
    userId: plan.student._id,
    sentBy: req.user._id,
    sentByRole: req.user.role,
    planId: plan._id,
  });
  res.json({ ok: true });
});
