import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../utils/tokens.js';

async function authenticate(req) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) throw httpError(401, 'Not authenticated');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    // Client should call POST /api/auth/refresh, then retry
    throw httpError(401, 'Access token invalid or expired');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw httpError(401, 'User no longer exists');
  // Checked on every request, so a ban works immediately (not after the token expires)
  if (user.status === 'banned') throw httpError(403, 'This account has been banned');
  return user;
}

// Requires a valid access-token cookie; attaches the fresh user to req.user.
export const protect = asyncHandler(async (req, _res, next) => {
  req.user = await authenticate(req);
  next();
});

// Public route that behaves differently for logged-in users (never fails on 401/403).
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  try {
    req.user = await authenticate(req);
  } catch (err) {
    if (err.status !== 401 && err.status !== 403) throw err;
  }
  next();
});

// Use after protect(): authorize('teacher', 'admin')
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(httpError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(httpError(403, 'You do not have permission to do this'));
    }
    next();
  };

// Use after protect(): only the super admin. Answers 404 to everyone else, so the feature stays hidden.
export const requireSuperAdmin = (req, _res, next) => {
  if (req.user?.role !== 'super_admin') {
    return next(httpError(404, 'Not found'));
  }
  next();
};

// Use after authorize('teacher'): teachers must be approved by an admin first
export const requireApprovedTeacher = (req, _res, next) => {
  const status = req.user.approvalStatus;
  if (status === 'pending') {
    return next(httpError(403, 'Your teacher account is waiting for admin approval'));
  }
  if (status === 'rejected') {
    return next(httpError(403, 'Your teacher application was not approved'));
  }
  next();
};
