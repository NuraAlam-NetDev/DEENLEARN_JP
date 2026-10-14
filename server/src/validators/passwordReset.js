import { z } from 'zod';

// Same password rules as registration (server/src/validators/auth.js)
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
});

export const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password,
});
