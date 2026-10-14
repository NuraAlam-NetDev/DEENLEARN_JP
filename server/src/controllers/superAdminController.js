import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';

// POST /api/admin/admins   body: { name, email, password }   (super admin only)
export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw httpError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'admin',
    approvalStatus: 'approved',
  });

  res.status(201).json({ user });
});

// PATCH /api/admin/users/:id/role   body: { role: 'student' | 'teacher' | 'admin' }   (super admin only)
export const setUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  if (String(user._id) === String(req.user._id)) throw httpError(400, 'You cannot change your own role');
  if (user.role === 'super_admin') throw httpError(403, 'The super admin role cannot be changed');

  const newRole = req.body.role;
  if (newRole === user.role) return res.json({ user });

  user.role = newRole;
  user.approvalStatus = 'approved'; // super admin decides directly
  user.reviewedAt = new Date();
  await user.save();

  // Not a teacher any more: take their courses off the catalogue
  if (newRole !== 'teacher') {
    await Course.updateMany({ teacher: user._id }, { published: false });
  }

  res.json({ user });
});