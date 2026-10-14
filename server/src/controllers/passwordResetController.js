import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { sendEmail } from '../utils/email.js';

const RESET_MINUTES = 30;
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

// POST /api/auth/forgot  body: { email }
// Always answers the same way, whether or not the email has an account.
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('name email status');
  if (user && user.status !== 'banned') {
    const token = crypto.randomBytes(32).toString('hex');
    await User.updateOne(
      { _id: user._id },
      { resetTokenHash: sha256(token), resetTokenExpires: new Date(Date.now() + RESET_MINUTES * 60 * 1000) }
    );
    const link = `${clientUrl()}/reset-password?token=${token}`;
    await sendEmail({
      kind: 'password_reset',
      to: user.email,
      subject: 'Reset your Deenlearn password',
      text: `Hi ${user.name},\n\nOpen this link to choose a new password (valid for ${RESET_MINUTES} minutes):\n${link}\n\nIf you did not ask for this, ignore this email.`,
    });
  }
  res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
});

// POST /api/auth/reset  body: { token, password }
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetTokenHash: sha256(token),
    resetTokenExpires: { $gt: new Date() },
  }).select('+resetTokenHash +resetTokenExpires');
  if (!user) throw httpError(400, 'This reset link is invalid or has expired. Please request a new one.');

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetTokenHash = '';
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ message: 'Your password has been changed. You can log in now.' });
});
