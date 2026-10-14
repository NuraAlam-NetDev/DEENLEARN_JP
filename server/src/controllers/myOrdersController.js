import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/payments/orders/mine  (student): every order they have made, newest first
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('course', 'title')
    .lean();

  res.json({
    orders: orders.map((o) => ({
      _id: String(o._id),
      courseId: o.course ? String(o.course._id) : null,
      courseTitle: o.course?.title ?? '',
      provider: o.provider,
      amount: o.amount,
      currency: o.currency,
      status: o.status,
      rejectReason: o.rejectReason || '',
      createdAt: o.createdAt,
      paidAt: o.paidAt ?? null,
      reviewedAt: o.reviewedAt ?? null,
    })),
  });
});
