import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Invalid email address').max(254);

// bcrypt only uses the first 72 bytes, so cap the length
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(100),
  email,
  password,
  // Public sign-up can never create admins
  role: z.enum(['student', 'teacher']).default('student'),
});

// Email is not editable here (changing it needs verification), only the display name
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(100),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(72),
    newPassword: password,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72),
});
