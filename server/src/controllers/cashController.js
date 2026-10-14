import Order from '../models/Order.js';
import Course from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { notifyStaff } from '../utils/notify.js';

// Teacher side of cash payments. A teacher only ever sees and confirms orders for their own courses.

// GET /api/teacher/cash-orders  -> cash payments waiting for the teacher to confirm
export const listCashOrders = asyncHandler(async (req, res) => {
  const courseIds = await Course.find({ teacher: req.user._id }).distinct('_id');
  const orders = await Order.find({ provider: 'cash', status: 'cash_pending', course: { $in: courseIds } })
    .sort({ createdAt: 1 })
    .populate('student', 'name email')
    .populate('course', 'title')
    .lean();
  res.json({ orders });
});

// Loads an order only if it is a cash order for one of this teacher's courses (otherwise 404)
async function ownCashOrder(req) {
  const order = await Order.findById(req.params.id);
  if (!order || order.provider !== 'cash') throw httpError(404, 'Order not found');
  const course = await Course.findById(order.course).select('teacher').lean();
  if (!course || String(course.teacher) !== String(req.user._id)) throw httpError(404, 'Order not found');
  return order;
}

// PATCH /api/teacher/cash-orders/:id/confirm  body: { receiptNo? }
// The teacher says the money arrived. The order then waits for the admin's approval.
export const confirmCash = asyncHandler(async (req, res) => {
  const order = await ownCashOrder(req);
  if (order.status !== 'cash_pending') throw httpError(400, 'This order is not waiting for cash confirmation');

  order.status = 'awaiting_approval';
  order.paidAt = new Date();
  order.gatewayTxnId = (req.body.receiptNo || '').trim() || `CASH-${String(order._id).slice(-8).toUpperCase()}`;
  await order.save();
  await notifyStaff(['admin', 'super_admin'], {
    type: 'payment',
    title: 'Cash payment waiting for approval',
    body: `The teacher confirmed a cash payment of ${order.amount} ${order.currency}. Please approve it.`,
    link: '/admin/orders',
  });
  res.json({ ok: true, status: order.status });
});

// PATCH /api/teacher/cash-orders/:id/reject  body: { reason }
// The money did not arrive. The order is cancelled and the student is not enrolled.
export const rejectCash = asyncHandler(async (req, res) => {
  const order = await ownCashOrder(req);
  if (order.status !== 'cash_pending') throw httpError(400, 'This order is not waiting for cash confirmation');

  order.status = 'cancelled';
  order.rejectReason = req.body.reason;
  order.reviewedBy = req.user._id;
  order.reviewedAt = new Date();
  await order.save();
  res.json({ ok: true, status: order.status });
});
