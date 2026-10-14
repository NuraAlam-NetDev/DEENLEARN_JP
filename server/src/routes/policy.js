import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { policySchema } from '../validators/policy.js';
import { setPlanPolicy, waivePlan, remindPlan, emailLog, graceReport } from '../controllers/policyController.js';

const router = Router();
const STAFF = ['admin', 'super_admin'];

// Installment policy per student (admins and the super admin)
router.patch('/admin/plans/:planId', protect, authorize(...STAFF), validate(policySchema), setPlanPolicy);
router.post('/admin/plans/:planId/waive', protect, authorize(...STAFF), waivePlan);
router.post('/admin/plans/:planId/remind', protect, authorize(...STAFF), remindPlan);

// Email log (admins and the super admin)
router.get('/email-log', protect, authorize(...STAFF), emailLog);

// Super admin only
router.get('/super/grace-report', protect, authorize('super_admin'), graceReport);

export default router;
