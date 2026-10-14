import mongoose from 'mongoose';
import Plan from '../models/Plan.js';
import EmailLog from '../models/EmailLog.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';
import { sendEmail } from '../utils/email.js';
import { remainingOf, nextInstallment, paidSoFar, GRACE_DAYS } from '../services/plans.js';
import { formatMoney } from '../utils/money.js';

// Loads a plan with its student and course, or fails
async function loadPlan(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid plan');
  const plan = await Plan.findById(id).populate('student', 'name email').populate('course', 'title');
  if (!plan) throw httpError(404, 'Plan not found');
  if (!plan.student) throw httpError(404, 'Student not found');
  return plan;
}

// PATCH /api/admin/plans/:planId  body: { graceDays?, accessMode?, emailOnOverdue? }
export const setPlanPolicy = asyncHandler(async (req, res) => {
  const plan = await loadPlan(req.params.planId);
  const { graceDays, accessMode, emailOnOverdue } = req.body;
  if (graceDays !== undefined) plan.graceDays = graceDays;
  if (accessMode !== undefined) plan.accessMode = accessMode;
  if (emailOnOverdue !== undefined) plan.emailOnOverdue = emailOnOverdue;
  plan.policyBy = req.user._id;
  plan.policyAt = new Date();
  await plan.save();
  res.json({ ok: true, plan: { graceDays: plan.graceDays, accessMode: plan.accessMode, emailOnOverdue: plan.emailOnOverdue } });
});

// POST /api/admin/plans/:planId/waive  body: { installmentNo? }  (default: the next unpaid installment)
// The student no longer owes that part. The forgiven money is recorded in waivedTotal.
export const waivePlan = asyncHandler(async (req, res) => {
  const plan = await loadPlan(req.params.planId);
  const no = Number(req.body?.installmentNo);
  const target = no ? plan.schedule.find((e) => e.no === no) : nextInstallment(plan);
  if (!target) throw httpError(400, 'No installment to waive');
  const owed = target.amount - target.paid;
  if (owed <= 0) throw httpError(400, 'That installment is already paid');

  target.amount = target.paid;
  plan.total = plan.schedule.reduce((sum, e) => sum + e.amount, 0);
  plan.waivedTotal = (plan.waivedTotal || 0) + owed;
  plan.policyBy = req.user._id;
  plan.policyAt = new Date();
  await plan.save();
  res.json({ ok: true, waived: owed, currency: plan.currency });
});

// POST /api/admin/plans/:planId/remind  -> sends the reminder email now (logged as "manual")
export const remindPlan = asyncHandler(async (req, res) => {
  const plan = await loadPlan(req.params.planId);
  const owed = remainingOf(plan);
  if (owed <= 0) throw httpError(400, 'Nothing is owed on this course');
  const next = nextInstallment(plan);
  const cur = plan.currency;
  const dueLine = next
    ? ` The next installment (${next.no}) is ${formatMoney(next.amount - next.paid, cur)}, due ${new Date(next.dueAt).toLocaleDateString()}.`
    : '';

  await sendEmail({
    kind: 'manual',
    to: plan.student.email,
    subject: `Payment reminder: ${plan.course.title}`,
    text: `Hi ${plan.student.name},\n\nYou still owe ${formatMoney(owed, cur)} for "${plan.course.title}".${dueLine}\n\nPlease pay in the app to keep access to the lessons.\n\nDeenlearn`,
    userId: plan.student._id,
    sentBy: req.user._id,
    sentByRole: req.user.role,
    planId: plan._id,
  });
  res.json({ ok: true });
});

// GET /api/email-log?kind=&q=&page=&limit=  (admins and the super admin)
export const emailLog = asyncHandler(async (req, res) => {
  const { kind, q, page, limit } = req.query;
  const filter = {};
  if (kind) filter.kind = kind;
  if (q) filter.to = { $regex: escapeRegex(q), $options: 'i' };
  const [logs, total] = await Promise.all([
    EmailLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sentBy', 'name role')
      .lean(),
    EmailLog.countDocuments(filter),
  ]);
  res.json({ logs, ...pageMeta(page, limit, total) });
});

// GET /api/super/grace-report  (super admin only)
// Who changed grace, free access and waivers, and how many emails each person sent.
export const graceReport = asyncHandler(async (req, res) => {
  const [byPerson, byKind, policies] = await Promise.all([
    EmailLog.aggregate([
      { $match: { sentBy: { $ne: null } } },
      { $group: { _id: { who: '$sentBy', kind: '$kind' }, n: { $sum: 1 } } },
    ]),
    EmailLog.aggregate([{ $group: { _id: '$kind', n: { $sum: 1 } } }]),
    Plan.find({
      $or: [
        { accessMode: 'free' },
        { graceDays: { $ne: GRACE_DAYS } },
        { waivedTotal: { $gt: 0 } },
        { emailOnOverdue: false },
      ],
    })
      .sort({ policyAt: -1 })
      .limit(200)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('policyBy', 'name role')
      .lean(),
  ]);

  const ids = [...new Set(byPerson.map((r) => String(r._id.who)))];
  const people = await User.find({ _id: { $in: ids } }).select('name role').lean();
  const names = new Map(people.map((p) => [String(p._id), p]));
  const emailsByPerson = {};
  for (const r of byPerson) {
    const key = String(r._id.who);
    const who = names.get(key) ?? { name: 'Unknown', role: '' };
    emailsByPerson[key] ??= { name: who.name, role: who.role, total: 0, kinds: {} };
    emailsByPerson[key].kinds[r._id.kind] = r.n;
    emailsByPerson[key].total += r.n;
  }

  res.json({
    emailsByKind: byKind.map((r) => ({ kind: r._id, n: r.n })),
    emailsByPerson: Object.values(emailsByPerson),
    policies: policies.map((p) => ({
      _id: p._id,
      student: p.student ? { name: p.student.name, email: p.student.email } : null,
      course: p.course?.title ?? '—',
      currency: p.currency,
      graceDays: p.graceDays,
      accessMode: p.accessMode,
      emailOnOverdue: p.emailOnOverdue !== false,
      waivedTotal: p.waivedTotal || 0,
      paid: paidSoFar(p),
      policyBy: p.policyBy ? { name: p.policyBy.name, role: p.policyBy.role } : null,
      policyAt: p.policyAt,
    })),
  });
});
