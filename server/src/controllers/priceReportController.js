import PriceChange from '../models/PriceChange.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta } from '../utils/pagination.js';

const DAYS_AFTER = 30;

// GET /api/admin/prices/history?page=&limit=&currency=&direction=up|down
// Every price change, with whether it went up or down, and how many approved sales came in
// during the 30 days after the change (same currency).
export const priceHistory = asyncHandler(async (req, res) => {
  const { page, limit, currency, direction } = req.query;
  const filter = {};
  if (currency) filter.currency = currency;
  if (direction === 'up') filter.$expr = { $gt: ['$to', '$from'] };
  if (direction === 'down') filter.$expr = { $lt: ['$to', '$from'] };

  const [rows, total] = await Promise.all([
    PriceChange.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('course', 'title')
      .populate('changedBy', 'name')
      .lean(),
    PriceChange.countDocuments(filter),
  ]);

  const changes = await Promise.all(
    rows.map(async (r) => {
      const until = new Date(new Date(r.createdAt).getTime() + DAYS_AFTER * 24 * 60 * 60 * 1000);
      const sales = await Order.aggregate([
        { $match: { course: r.course?._id ?? r.course, status: 'approved', currency: r.currency, reviewedAt: { $gte: r.createdAt, $lt: until } } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      ]);
      return {
        _id: r._id,
        course: r.course ? { _id: r.course._id, title: r.course.title } : null,
        currency: r.currency,
        from: r.from,
        to: r.to,
        direction: r.to > r.from ? 'up' : 'down',
        changedBy: r.changedBy?.name ?? '',
        changedByRole: r.changedByRole,
        changedAt: r.createdAt,
        salesAfter: sales[0]?.count ?? 0,
        revenueAfter: sales[0]?.amount ?? 0,
        daysAfter: DAYS_AFTER,
      };
    })
  );

  res.json({ changes, ...pageMeta(page, limit, total) });
});
