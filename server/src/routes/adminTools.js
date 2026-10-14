import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bulkEmailSchema, monthQuery } from '../validators/adminTools.js';
import { bulkEmail, couponReport, monthlyReportPdf } from '../controllers/adminToolsController.js';

const router = Router();
const STAFF = ['admin', 'super_admin'];

router.post('/admin/bulk-email', protect, authorize(...STAFF), validate(bulkEmailSchema), bulkEmail);
router.get('/admin/coupons/report', protect, authorize(...STAFF), couponReport);
router.get('/admin/reports/monthly.pdf', protect, authorize(...STAFF), validate(monthQuery, 'query'), monthlyReportPdf);

export default router;
