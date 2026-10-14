import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import Review from '../models/Review.js';
import Wishlist from '../models/Wishlist.js';
import Notification from '../models/Notification.js';
import Order from '../models/Order.js';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { formatMoney } from '../utils/money.js';

// ---------- reviews ----------

// GET /api/reviews/:courseId  (public). Also tells a logged-in student whether they can review.
export const listReviews = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const reviews = await Review.find({ course: courseId }).sort({ createdAt: -1 }).limit(100).populate('student', 'name').lean();
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  let canReview = false;
  let mine = null;
  if (req.user?.role === 'student') {
    mine = reviews.find((r) => String(r.student?._id) === String(req.user._id)) ?? null;
    canReview = await isCompleted(req.user._id, courseId);
  }
  res.json({ average, count, reviews, canReview, mine: mine ? { rating: mine.rating, comment: mine.comment } : null });
});

// A student has finished the course when every lesson is completed
async function isCompleted(studentId, courseId) {
  const enrolled = await Enrollment.exists({ student: studentId, course: courseId });
  if (!enrolled) return false;
  const total = await Lesson.countDocuments({ course: courseId });
  if (!total) return false;
  const done = await Progress.countDocuments({ student: studentId, course: courseId, completed: true });
  return done >= total;
}

// POST /api/reviews/:courseId  body: { rating, comment }
export const createReview = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!(await isCompleted(req.user._id, courseId))) {
    throw httpError(403, 'You can review this course after you finish all its lessons');
  }
  const review = await Review.findOneAndUpdate(
    { course: courseId, student: req.user._id },
    { rating: req.body.rating, comment: req.body.comment },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ review });
});

// ---------- wishlist ----------

// GET /api/wishlist
export const listWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate('course', 'title category priceJPY priceUSD published thumbnail')
    .lean();
  res.json({ items: items.filter((i) => i.course) });
});

// POST /api/wishlist/:courseId
export const addWishlist = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('published').lean();
  if (!course || !course.published) throw httpError(404, 'Course not found');
  await Wishlist.updateOne(
    { student: req.user._id, course: req.params.courseId },
    { $setOnInsert: { student: req.user._id, course: req.params.courseId } },
    { upsert: true }
  );
  res.status(201).json({ ok: true });
});

// DELETE /api/wishlist/:courseId
export const removeWishlist = asyncHandler(async (req, res) => {
  await Wishlist.deleteOne({ student: req.user._id, course: req.params.courseId });
  res.json({ ok: true });
});

// ---------- notifications ----------

// GET /api/notifications  -> newest 50, plus how many are unread
export const listNotifications = asyncHandler(async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ items, unread });
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ ok: true });
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});

// ---------- receipts (PDF) ----------

const ascii = (s) => String(s ?? '').replace(/[^\x20-\x7E]/g, '?'); // the standard PDF font only knows basic characters

// GET /api/receipts/:orderId  -> a PDF for an approved payment (the student's own order only)
export const receiptPdf = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) throw httpError(400, 'Invalid order');
  const order = await Order.findOne({ _id: req.params.orderId, student: req.user._id, status: 'approved' })
    .populate('course', 'title')
    .populate('student', 'name email')
    .lean();
  if (!order) throw httpError(404, 'A receipt is only available for an approved payment');

  const doc = await PDFDocument.create();
  const page = doc.addPage([420, 595]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawText('Deenlearn - Payment receipt', { x: 40, y: 545, size: 16, font: bold });
  let y = 510;
  const row = (label, value, strong = false) => {
    page.drawText(ascii(label), { x: 40, y, size: 10, font: bold });
    page.drawText(ascii(value), { x: 170, y, size: 10, font: strong ? bold : font });
    y -= 22;
  };
  const approvedOn = order.reviewedAt ?? order.paidAt ?? order.createdAt;
  row('Receipt no.', `DL-${String(order._id).slice(-8).toUpperCase()}`);
  row('Date', new Date(approvedOn).toISOString().slice(0, 10));
  row('Student', order.student?.name);
  row('Email', order.student?.email);
  row('Course', order.course?.title);
  row('Amount paid', `${formatMoney(order.amount, order.currency)}`, true);
  if (order.discount) row('Discount', `${formatMoney(order.discount, order.currency)} (code ${order.couponCode})`);
  row('Payment method', order.provider === 'stripe' ? 'Card (Stripe)' : order.provider === 'cash' ? 'Cash to teacher' : order.provider);
  row('Transaction ID', order.gatewayTxnId || '-');
  y -= 14;
  page.drawText('Thank you for learning with Deenlearn.', { x: 40, y, size: 10, font });

  const bytes = await doc.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="receipt-${order._id}.pdf"`);
  res.send(Buffer.from(bytes));
});
