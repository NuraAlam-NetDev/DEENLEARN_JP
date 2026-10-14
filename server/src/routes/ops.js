import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { refundSchema, accessRequestSchema, decisionSchema } from '../validators/ops.js';
import { refundOrder, listRefunds } from '../controllers/refundController.js';
import { requestFreeAccess, listAccessRequests, decideAccessRequest } from '../controllers/accessController.js';
import { overview } from '../controllers/overviewController.js';

const router = Router();
const STAFF = ['admin', 'super_admin'];

// Admin home numbers, refunds, free-access decisions
router.get('/admin/overview', protect, authorize(...STAFF), overview);
router.post('/admin/orders/:id/refund', protect, authorize(...STAFF), validate(refundSchema), refundOrder);
router.get('/admin/refunds', protect, authorize(...STAFF), listRefunds);

// Free-access requests: a student asks, the admin decides
router.post('/access-requests', protect, authorize('student'), validate(accessRequestSchema), requestFreeAccess);
router.get('/access-requests', protect, authorize(...STAFF), listAccessRequests);
router.patch('/access-requests/:id', protect, authorize(...STAFF), validate(decisionSchema), decideAccessRequest);

export default router;
