import AuditLog from '../models/AuditLog.js';

const CHANGES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Records every successful change made under /api/admin and /api/super.
// Runs after the response is sent, so it never slows the request or breaks it if logging fails.
export function auditChanges(req, res, next) {
  if (!CHANGES.has(req.method)) return next();

  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) return;
    const action = `${req.method} ${(req.baseUrl + req.path).replace(/\/[a-f\d]{24}(?=\/|$)/gi, '/:id')}`;
    AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action,
      targetId: req.params?.id ?? '',
      status: res.statusCode,
      keys: Object.keys(req.body || {}).slice(0, 20),
      ip: req.ip || '',
      userAgent: (req.get('user-agent') || '').slice(0, 200),
    }).catch((err) => console.error('Audit log failed:', err.message));
  });

  next();
}
