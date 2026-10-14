import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/tokens.js';

const BCRYPT_ROUNDS = 12;
// Compared against when the email doesn't exist, so response time doesn't reveal it
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const bannedError = (user) =>
  httpError(403, `This account has been banned${user.banReason ? `: ${user.banReason}` : ''}`);

// Create a refresh-token record and set both cookies
async function startSession(res, user) {
  const jti = crypto.randomUUID();
  await RefreshToken.create({
    jti,
    user: user._id,
    expiresAt: new Date(Date.now() + env.refreshTtlSeconds * 1000),
  });
  setAuthCookies(res, signAccessToken(user._id), signRefreshToken(user._id, jti));
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (await User.exists({ email })) throw httpError(409, 'Email is already registered');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let user;
  try {
    user = await User.create({
      name,
      email,
      passwordHash,
      role,
      // New teachers must be approved by an admin before they can manage courses
      approvalStatus: role === 'teacher' ? 'pending' : 'approved',
    });
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'Email is already registered');
    throw err;
  }

  await startSession(res, user);
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !valid) throw httpError(401, 'Invalid email or password');

  // Only revealed after the password is correct
  if (user.status === 'banned') throw bannedError(user);

  await startSession(res, user);
  res.json({ user });
});

// Refresh-token rotation: every refresh issues a new token and revokes the old one.
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw httpError(401, 'No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    throw httpError(401, 'Refresh token invalid or expired');
  }

  // Atomic delete: only one request can consume a given token
  const stored = await RefreshToken.findOneAndDelete({ jti: payload.jti });
  if (!stored) {
    // Valid signature but already used/revoked -> possible theft. Kill all sessions.
    await RefreshToken.deleteMany({ user: payload.sub });
    clearAuthCookies(res);
    throw httpError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    clearAuthCookies(res);
    throw httpError(401, 'User no longer exists');
  }
  if (user.status === 'banned') {
    await RefreshToken.deleteMany({ user: user._id });
    clearAuthCookies(res);
    throw bannedError(user);
  }

  await startSession(res, user);
  res.json({ user });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const { jti } = verifyRefreshToken(token);
      await RefreshToken.deleteOne({ jti });
    } catch {
      // expired/invalid token: nothing to revoke
    }
  }
  clearAuthCookies(res);
  res.json({ message: 'Logged out' });
});

export const me = (req, res) => {
  res.json({ user: req.user });
};

// PATCH /api/auth/me   { name }
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: req.body.name },
    { new: true, runValidators: true }
  );
  res.json({ user });
});

// PUT /api/auth/password   { currentPassword, newPassword }
// Signs out every other device, then keeps this one logged in with a fresh session.
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw httpError(400, 'Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save();

  await RefreshToken.deleteMany({ user: user._id });
  await startSession(res, user);
  res.json({ message: 'Password changed' });
});
