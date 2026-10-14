import { Router } from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewSchema } from '../validators/extras.js';
import { listCoupons, createCoupon, deactivateCoupon } from '../controllers/couponController.js';
import { planReport } from '../controllers/planReportController.js';
import {
  listReviews, createReview, listWishlist, addWishlist, removeWishlist,
  listNotifications, markRead, markAllRead, receiptPdf,
} from '../controllers/extrasController.js';

const router = Router();
const STAFF = ['admin', 'super_admin', 'teacher'];

// Reviews
router.get('/reviews/:courseId', optionalAuth, listReviews);
router.post('/reviews/:courseId', protect, authorize('student'), validate(reviewSchema), createReview);

// Wishlist (students)
router.get('/wishlist', protect, authorize('student'), listWishlist);
router.post('/wishlist/:courseId', protect, authorize('student'), addWishlist);
router.delete('/wishlist/:courseId', protect, authorize('student'), removeWishlist);

// Notifications (everyone logged in)
router.get('/notifications', protect, listNotifications);
router.patch('/notifications/read-all', protect, markAllRead);
router.patch('/notifications/:id/read', protect, markRead);

// Coupons (admins for any course, teachers for their own)
router.get('/coupons', protect, authorize(...STAFF), listCoupons);
router.post('/coupons', protect, authorize(...STAFF), createCoupon);
router.patch('/coupons/:id', protect, authorize(...STAFF), deactivateCoupon);

// Installment plans: admins see all, teachers see their own courses
router.get('/plans', protect, authorize(...STAFF), planReport);

// Receipts (students, approved payments only)
router.get('/receipts/:orderId', protect, authorize('student'), receiptPdf);

export default router;
