import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';

// GET /api/super/audit?page=&limit=&actor=&action=&from=&to=   (super admin only)
export const listAudit = asyncHandler(async (req, res) => {
  const { page, limit, actor, action, from, to } = req.query;

  const filter = {};
  if (actor) filter.actor = actor;
  if (action) filter.action = { $regex: escapeRegex(action), $options: 'i' };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('actor', 'name email role')
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ logs, ...pageMeta(page, limit, total) });
});
