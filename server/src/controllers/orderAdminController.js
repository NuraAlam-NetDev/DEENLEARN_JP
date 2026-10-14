import Order from '../models/Order.js';
import Enrollment from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { notify } from '../utils/notify.js';
import { finishApproval } from '../services/plans.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';

// Admins only see the approval queue: who paid for what, and the transaction ID to check.
// Amounts, revenue and history are never sent to admins (those are on the super admin's /api/super routes).

// GET /api/admin/orders?page=&limit=&q=   (q = transaction ID)
export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, q } = req.query;

  const filter = { status: 'awaiting_approval' };
  if (q) filter.gatewayTxnId = q;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      // amount, currency and method are needed to check a payment; history and totals are never sent
      .select('gatewayTxnId createdAt student course amount currency provider')
      .sort({ createdAt: 1 }) // oldest first, so nothing waits forever
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'name email')
      .populate('course', 'title')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, ...pageMeta(page, limit, total) });
});

// PATCH /api/admin/orders/:id/approve  -> the student gets enrolled
export const approveOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, 'Order not found');
  if (order.status !== 'awaiting_approval') {
    throw httpError(400, 'Only a payment waiting for approval can be approved');
  }

  await finishApproval(order, req.user._id);
  res.json({ ok: true, status: 'approved' });
});

// PATCH /api/admin/orders/:id/reject  body: { reason }
export const rejectOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, 'Order not found');
  if (order.status !== 'awaiting_approval') {
    throw httpError(400, 'Only a payment waiting for approval can be rejected');
  }

  order.status = 'rejected';
  order.reviewedBy = req.user._id;
  order.reviewedAt = new Date();
  order.rejectReason = req.body.reason;
  await order.save();
  await notify(order.student, {
    type: 'payment',
    title: 'Payment not approved',
    body: `Your payment was not approved. Reason: ${order.rejectReason}`,
    link: '/student/orders',
    email: true,
  });
  res.json({ ok: true, status: 'rejected' });
});

// GET /api/admin/orders/history?page=&limit=  -> only the orders THIS admin approved or rejected
export const myReviewHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const filter = { reviewedBy: req.user._id, status: { $in: ['approved', 'rejected'] } };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select('status rejectReason reviewedAt amount currency provider student course')
      .sort({ reviewedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'name email')
      .populate('course', 'title')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, ...pageMeta(page, limit, total) });
});
