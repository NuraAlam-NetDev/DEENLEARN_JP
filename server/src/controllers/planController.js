import Course from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import {
  planFor, paidSoFar, remainingOf, nextInstallment, overdueInstallments,
  GRACE_DAYS, INSTALLMENT_OPTIONS, MIN_PAYMENT,
} from '../services/plans.js';

// GET /api/payments/plan/:courseId  -> the student's installments for one course, and the prices
export const planSummary = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('priceJPY priceUSD').lean();
  if (!course) throw httpError(404, 'Course not found');

  const price = { JPY: course.priceJPY, USD: course.priceUSD };
  const base = { price, installmentOptions: INSTALLMENT_OPTIONS, minimum: MIN_PAYMENT, graceDays: GRACE_DAYS };
  const plan = await planFor(req.user._id, course._id);
  if (!plan) return res.json({ ...base, plan: null });

  const now = new Date();
  const grace = (plan.graceDays ?? GRACE_DAYS) * 24 * 60 * 60 * 1000;
  const next = nextInstallment(plan);
  res.json({
    ...base,
    plan: {
      currency: plan.currency,
      total: plan.total,
      paid: paidSoFar(plan),
      remaining: remainingOf(plan),
      schedule: plan.schedule.map((e) => ({
        no: e.no,
        amount: e.amount,
        paid: e.paid,
        dueAt: e.dueAt,
        status: e.paid >= e.amount ? 'paid'
          : now.getTime() > new Date(e.dueAt).getTime() + grace ? 'overdue'
          : e.paid > 0 ? 'partial' : 'due',
      })),
      nextDue: next ? { no: next.no, owed: next.amount - next.paid, dueAt: next.dueAt } : null,
      overdue: overdueInstallments(plan, now).length > 0,
    },
  });
});
