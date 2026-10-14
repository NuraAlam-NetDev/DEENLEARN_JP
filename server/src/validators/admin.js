import { z } from 'zod';
import { objectId, paginationFields } from './common.js';

export const listUsersQuery = z.object({
  ...paginationFields(20, 100),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin']).optional(),
  status: z.enum(['active', 'banned']).optional(),
  approval: z.enum(['pending', 'approved', 'rejected']).optional(),
  q: z.string().trim().max(100).optional(),
});

export const banUserSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const rejectTeacherSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const adminListCoursesQuery = z.object({
  ...paginationFields(20, 100),
  published: z.enum(['true', 'false']).optional(),
  teacher: objectId.optional(),
  q: z.string().trim().max(100).optional(),
});

export const createAdminSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, 'Password needs at least one letter')
    .regex(/\d/, 'Password needs at least one number'),
});

export const setRoleSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin']),
});

export const ordersQuery = z.object({
  ...paginationFields(20, 100),
  q: z.string().trim().max(100).optional(), // transaction ID
});

export const rejectOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Give a short reason').max(500),
});
