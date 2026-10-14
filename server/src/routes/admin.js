import { Router } from 'express';
import { adminStudents, adminStudentReport } from '../controllers/studentProgressController.js';
import { studentListQuery } from '../validators/progress.js';
import { protect, authorize, requireSuperAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { auditChanges } from '../middleware/audit.js';
import {
  getStats, listUsers, banUser, unbanUser, approveTeacher, rejectTeacher,
  listCourses, deleteCourse, setCourseVisibility,
} from '../controllers/adminController.js';
import { createAdmin, setUserRole } from '../controllers/superAdminController.js';
import { listOrders, approveOrder, rejectOrder, myReviewHistory } from '../controllers/orderAdminController.js';
import { listTransactions, reports } from '../controllers/financeController.js';
import { priceHistory } from '../controllers/priceReportController.js';
import { transactionsQuery } from '../validators/finance.js';
import {
  listUsersQuery, banUserSchema, rejectTeacherSchema, adminListCoursesQuery,
  createAdminSchema, setRoleSchema, ordersQuery, rejectOrderSchema,
} from '../validators/admin.js';

const router = Router();

// Everything below: admins and the super admin. Every change is written to the audit log.
router.use(protect, authorize('admin', 'super_admin'), auditChanges);

router.get('/stats', getStats);

router.get('/users', validate(listUsersQuery, 'query'), listUsers);
router.patch('/users/:id/ban', validate(banUserSchema), banUser);
router.patch('/users/:id/unban', unbanUser);

router.patch('/teachers/:id/approve', approveTeacher);
router.patch('/teachers/:id/reject', validate(rejectTeacherSchema), rejectTeacher);

router.get('/courses', validate(adminListCoursesQuery, 'query'), listCourses);
router.patch('/courses/:id/visibility', setCourseVisibility);
router.delete('/courses/:id', deleteCourse);

// Payment approval queue
router.get('/orders', validate(ordersQuery, 'query'), listOrders);
router.get('/orders/history', validate(ordersQuery, 'query'), myReviewHistory);
router.patch('/orders/:id/approve', approveOrder);
router.patch('/orders/:id/reject', validate(rejectOrderSchema), rejectOrder);

// Student progress across the platform (admins and the super admin)
router.get('/students', validate(studentListQuery, 'query'), adminStudents);
router.get('/students/:studentId/report', adminStudentReport);

// Payment history and revenue reports (admins and the super admin)
router.get('/finance/transactions', validate(transactionsQuery, 'query'), listTransactions);
router.get('/finance/reports', reports);

// Price changes and the sales that followed them (admins and the super admin)
router.get('/prices/history', priceHistory);

// Super admin only. For admins these answer 404, the same as any unknown route.
router.post('/admins', requireSuperAdmin, validate(createAdminSchema), createAdmin);
router.patch('/users/:id/role', requireSuperAdmin, validate(setRoleSchema), setUserRole);

export default router;
