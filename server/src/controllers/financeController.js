import Course from '../models/Course.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';

// Super admin only (mounted under /api/super with requireSuperAdmin).

// GET /api/super/transactions?page=&limit=&status=&provider=&currency=&q=
// Full transaction history: amounts, gateway, who approved, and the reason for any rejection.
export const listTransactions = asyncHandler(async (req, res) => {
  const { page, limit, status, provider, currency, q } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (provider) filter.provider = provider;
  if (currency) filter.currency = currency;
  if (q) {
    const courses = await Course.find({ title: { $regex: escapeRegex(q), $options: 'i' } })
      .select('_id')
      .limit(200)
      .lean();
    filter.$or = [{ gatewayTxnId: q }, { providerRef: q }, { course: { $in: courses.map((c) => c._id) } }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('reviewedBy', 'name')
      .lean(),
    Order.countDocuments(filter),
  ]);

  // Only the super admin sees who approved or rejected a payment, and why.
  // Admins get the same list without those fields (enforced here, not only in the screen).
  const transactions = req.user.role === 'super_admin'
    ? orders
    : orders.map(({ reviewedBy, reviewedAt, rejectReason, ...rest }) => rest);

  res.json({ transactions, ...pageMeta(page, limit, total) });
});

// GET /api/super/reports
// Counts by status, approved revenue per currency, the last 12 months, and the top 10 courses by revenue.
export const reports = asyncHandler(async (_req, res) => {
  const [byStatus, totals, monthly, topRaw] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: 'approved', reviewedAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { y: { $year: '$reviewedAt' }, m: { $month: '$reviewedAt' }, currency: '$currency' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Order.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: { course: '$course', currency: '$currency' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 30 },
    ]),
  ]);

  const titles = new Map(
    (await Course.find({ _id: { $in: topRaw.map((r) => r._id.course) } }).select('title').lean()).map((c) => [
      String(c._id),
      c.title,
    ])
  );

  res.json({
    counts: Object.fromEntries(byStatus.map((r) => [r._id, r.n])),
    revenue: totals.map((r) => ({ currency: r._id, total: r.total, count: r.count })),
    monthly: monthly.map((r) => ({
      year: r._id.y,
      month: r._id.m,
      currency: r._id.currency,
      total: r.total,
      count: r.count,
    })),
    topCourses: topRaw.slice(0, 10).map((r) => ({
      courseId: r._id.course,
      title: titles.get(String(r._id.course)) ?? 'Deleted course',
      currency: r._id.currency,
      total: r.total,
      count: r.count,
    })),
  });
});

// GET /api/super/prices: every course with its prices and what it has sold
export const priceList = asyncHandler(async (_req, res) => {
  const [courses, sales] = await Promise.all([
    Course.find({})
      .select('title category published priceJPY priceUSD teacher')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
    Order.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: { course: '$course', currency: '$currency' }, n: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const soldBy = new Map();
  for (const row of sales) {
    const key = String(row._id.course);
    if (!soldBy.has(key)) soldBy.set(key, { JPY: { n: 0, total: 0 }, USD: { n: 0, total: 0 } });
    soldBy.get(key)[row._id.currency] = { n: row.n, total: row.total };
  }

  res.json({
    courses: courses.map((c) => ({
      ...c,
      sales: soldBy.get(String(c._id)) ?? { JPY: { n: 0, total: 0 }, USD: { n: 0, total: 0 } },
    })),
  });
});
