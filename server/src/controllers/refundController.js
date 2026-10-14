import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Plan from '../models/Plan.js';
import Refund from '../models/Refund.js';
import Enrollment from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta } from '../utils/pagination.js';
import { notify } from '../utils/notify.js';
import { refundStripePayment, stripeConfigured } from '../services/payments/stripe.js';
import { planFor, reverseAllocation, paidSoFar } from '../services/plans.js';
import { formatMoney } from '../utils/money.js';

// POST /api/admin/orders/:id/refund  body: { amount?, reason }
// Card payments are refunded through Stripe. Cash payments are only recorded: the admin has already handed the money back.
export const refundOrder = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid payment');
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, 'Payment not found');
  if (order.status !== 'approved') throw httpError(400, 'Only an approved payment can be refunded');

  const left = order.amount - (order.refundedAmount || 0);
  if (left <= 0) throw httpError(400, 'This payment is already fully refunded');
  const amount = req.body.amount ? Number(req.body.amount) : left;
  if (amount > left) throw httpError(400, `At most ${formatMoney(left, order.currency)} can still be refunded`);

  let method = 'manual';
  let stripeRefundId = '';
  if (order.provider === 'stripe') {
    if (!stripeConfigured()) throw httpError(503, 'Card refunds need the Stripe key to be set');
    if (!order.gatewayTxnId) throw httpError(400, 'This card payment has no Stripe payment id, so refund it in the Stripe dashboard');
    stripeRefundId = await refundStripePayment({ paymentIntentId: order.gatewayTxnId, amount, currency: order.currency });
    method = 'stripe';
  }

  // Record it: the order, the installments it paid, the enrollment (if nothing is paid any more), the log
  order.refundedAmount = (order.refundedAmount || 0) + amount;
  order.refundedAt = new Date();
  await order.save();

  const plan = await planFor(order.student, order.course);
  if (plan) {
    reverseAllocation(plan, amount);
    await plan.save();
    if (paidSoFar(plan) <= 0) await Enrollment.deleteOne({ student: order.student, course: order.course });
  }

  await Refund.create({
    order: order._id, student: order.student, course: order.course,
    amount, currency: order.currency, method, stripeRefundId,
    reason: req.body.reason, refundedBy: req.user._id, refundedByRole: req.user.role,
  });

  await notify(order.student, {
    type: 'payment',
    title: 'Refund made',
    body: `${formatMoney(amount, order.currency)} was refunded for your payment. Reason: ${req.body.reason}`,
    link: '/student/orders',
    email: true,
    kind: 'payment',
  });
  res.json({ ok: true, refunded: amount, method, stripeRefundId });
});

// GET /api/admin/refunds?page=&limit=  (newest first)
export const listRefunds = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const [rows, total] = await Promise.all([
    Refund.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('refundedBy', 'name role')
      .lean(),
    Refund.countDocuments({}),
  ]);
  res.json({ refunds: rows, ...pageMeta(page, limit, total) });
});
