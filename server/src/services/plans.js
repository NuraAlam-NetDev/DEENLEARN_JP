import Plan from '../models/Plan.js';
import Enrollment from '../models/Enrollment.js';
import { notify } from '../utils/notify.js';
import { formatMoney } from '../utils/money.js';

export const GRACE_DAYS = 7;
export const INSTALLMENT_OPTIONS = [1, 2, 3, 6];
export const MIN_PAYMENT = { JPY: 500, USD: 5 }; // smallest partial payment
const DAY_MS = 24 * 60 * 60 * 1000;

export function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

// Splits the total into equal monthly parts. The last part takes any rounding difference.
export function buildSchedule(total, n, start) {
  const base = Math.floor(total / n);
  const schedule = [];
  for (let i = 0; i < n; i++) {
    const amount = i === n - 1 ? total - base * (n - 1) : base;
    schedule.push({ no: i + 1, amount, dueAt: addMonths(start, i), paid: 0, reminded: false });
  }
  return schedule;
}

export const paidSoFar = (plan) => plan.schedule.reduce((sum, e) => sum + e.paid, 0);
export const remainingOf = (plan) => plan.total - paidSoFar(plan);

// Takes money back out of the installments, latest paid first (the reverse of allocatePayment)
export function reverseAllocation(plan, amount) {
  let left = amount;
  for (const e of [...plan.schedule].reverse()) {
    if (left <= 0) break;
    const take = Math.min(e.paid, left);
    e.paid -= take;
    left -= take;
  }
}

// Gives a payment to the installments in order: the earliest unpaid one first
export function allocatePayment(plan, amount) {
  let left = amount;
  for (const e of plan.schedule) {
    if (left <= 0) break;
    const owed = e.amount - e.paid;
    if (owed <= 0) continue;
    const take = Math.min(owed, left);
    e.paid += take;
    left -= take;
  }
}

export const nextInstallment = (plan) => plan.schedule.find((e) => e.paid < e.amount) ?? null;

// Installments that are unpaid and past their due date plus the grace period
export function overdueInstallments(plan, now = new Date()) {
  const graceMs = (plan.graceDays ?? GRACE_DAYS) * DAY_MS;
  return plan.schedule.filter((e) => e.paid < e.amount && now.getTime() > new Date(e.dueAt).getTime() + graceMs);
}

export const planFor = (studentId, courseId) => Plan.findOne({ student: studentId, course: courseId });

// True when the student may not study: an installment is past its grace period.
// Courses bought before plans existed have no plan, so they are never blocked.
// The first time this happens for an installment, the student is told in the app and by email.
export async function planBlocksAccess(studentId, courseId) {
  const plan = await planFor(studentId, courseId);
  if (!plan) return false;
  if (plan.accessMode === 'free') return false; // the admin gave this student free access
  const overdue = overdueInstallments(plan);
  if (!overdue.length) return false;

  const fresh = plan.schedule.filter((e) => overdue.includes(e) && !e.reminded);
  if (fresh.length) {
    fresh.forEach((e) => { e.reminded = true; });
    await plan.save();
    await notify(studentId, {
      type: 'payment',
      title: 'Installment overdue',
      body: `An installment for one of your courses is overdue. Pay it within the grace period to keep access to the lessons.`,
      link: '/student/courses',
      email: plan.emailOnOverdue !== false,
      kind: 'installment',
    });
  }
  return true;
}

// Called when a payment is confirmed: card (automatic) or cash (teacher + admin).
// Creates the plan on the first payment, gives the money to the installments, and enrolls the student.
export async function finishApproval(order, reviewerId = null) {
  const now = new Date();
  order.status = 'approved';
  order.reviewedAt = now;
  if (reviewerId) order.reviewedBy = reviewerId;
  order.rejectReason = '';
  if (!order.paidAt) order.paidAt = now;
  await order.save();

  let plan = await planFor(order.student, order.course);
  if (!plan) {
    const total = order.planTotal || order.amount;
    plan = await Plan.create({
      student: order.student,
      course: order.course,
      currency: order.currency,
      total,
      schedule: buildSchedule(total, order.installments || 1, now),
    });
  }
  allocatePayment(plan, order.amount);
  await plan.save();

  try {
    await Enrollment.create({ student: order.student, course: order.course });
  } catch (err) {
    if (err.code !== 11000) throw err; // already enrolled: fine
  }

  const left = remainingOf(plan);
  await notify(order.student, {
    type: 'payment',
    title: 'Payment approved',
    body: left > 0
      ? `Your payment was approved. Remaining balance for this course: ${formatMoney(left, plan.currency)}.`
      : 'Your payment was approved. You are now enrolled in the course.',
    link: '/student/courses',
    email: true,
    kind: 'payment',
  });
  return order;
}
