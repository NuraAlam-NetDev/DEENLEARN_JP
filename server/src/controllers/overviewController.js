import Order from '../models/Order.js';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import AccessRequest from '../models/AccessRequest.js';
import Refund from '../models/Refund.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { overdueInstallments, remainingOf } from '../services/plans.js';

// GET /api/admin/overview  -> the numbers for the admin's home page
export const overview = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const revenueSince = (since) =>
    Order.aggregate([
      { $match: { status: 'approved', reviewedAt: { $gte: since } } },
      { $group: { _id: '$currency', gross: { $sum: '$amount' }, refunded: { $sum: '$refundedAmount' }, count: { $sum: 1 } } },
    ]);

  const [today, month, plans, newStudents, awaitingCard, awaitingCash, pendingAccess, refunds] = await Promise.all([
    revenueSince(startOfDay),
    revenueSince(startOfMonth),
    Plan.find({ $expr: { $lt: [{ $sum: '$schedule.paid' }, '$total'] } }).limit(5000).lean(),
    User.countDocuments({ role: 'student', createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ status: 'awaiting_approval' }),
    Order.countDocuments({ status: 'cash_pending' }),
    AccessRequest.countDocuments({ status: 'pending' }),
    Refund.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$currency', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  // Money still owed, per currency, and how many installments are past grace
  const owed = {};
  let overdueCount = 0;
  for (const p of plans) {
    owed[p.currency] = (owed[p.currency] || 0) + remainingOf(p);
    if (p.accessMode !== 'free' && overdueInstallments(p, now).length) overdueCount += 1;
  }

  const shape = (rows) => rows.map((r) => ({ currency: r._id, gross: r.gross ?? r.amount ?? 0, refunded: r.refunded ?? 0, net: (r.gross ?? 0) - (r.refunded ?? 0), count: r.count ?? 0 }));
  res.json({
    today: shape(today),
    month: shape(month),
    owed: Object.entries(owed).map(([currency, amount]) => ({ currency, amount })),
    overdueCount,
    plansOwing: plans.length,
    newStudentsThisMonth: newStudents,
    pending: { cardPayments: awaitingCard, cashPayments: awaitingCash, accessRequests: pendingAccess },
    refundsThisMonth: shape(refunds),
  });
});
