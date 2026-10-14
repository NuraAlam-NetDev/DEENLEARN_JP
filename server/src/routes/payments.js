import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkoutSchema } from '../validators/payment.js';
import { checkout, orderStatus } from '../controllers/paymentController.js';
import { myOrders } from '../controllers/myOrdersController.js';
import { planSummary } from '../controllers/planController.js';

// Stripe's webhook is mounted in app.js (it needs the raw body)
const router = Router();

router.post('/checkout', protect, authorize('student'), validate(checkoutSchema), checkout);
router.get('/orders/mine', protect, authorize('student'), myOrders);
router.get('/plan/:courseId', protect, authorize('student'), planSummary);
router.get('/orders/:id', protect, authorize('student'), orderStatus);

export default router;
