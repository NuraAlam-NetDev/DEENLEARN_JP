import Coupon from '../models/Coupon.js';
import Course from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { couponSchema } from '../validators/extras.js';

// Checks a code for this course and currency, and reserves one use.
// Returns the discount and the price the student pays. The server decides the price, never the browser.
export async function applyCoupon({ code, course, currency, amount }) {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true });
  if (!coupon) throw httpError(400, 'This coupon code is not valid');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw httpError(400, 'This coupon has expired');
  if (coupon.currency !== 'ANY' && coupon.currency !== currency) {
    throw httpError(400, `This coupon only works for ${coupon.currency} payments`);
  }
  if (coupon.course && String(coupon.course) !== String(course._id)) {
    throw httpError(400, 'This coupon is not valid for this course');
  }

  const discount = coupon.kind === 'percent' ? Math.round((amount * coupon.value) / 100) : coupon.value;
  const finalAmount = amount - discount;
  if (finalAmount < 1) throw httpError(400, 'This coupon would make the price too low');

  // Reserve one use atomically, so two students cannot take the last one
  const reserved = await Coupon.findOneAndUpdate(
    { _id: coupon._id, $or: [{ maxUses: 0 }, { $expr: { $lt: ['$uses', '$maxUses'] } }] },
    { $inc: { uses: 1 } },
    { new: true }
  );
  if (!reserved) throw httpError(400, 'This coupon has been used up');

  return { code: reserved.code, discount, finalAmount };
}

// GET /api/coupons  (admin: all codes; teacher: codes for their own courses)
export const listCoupons = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'teacher') {
    const ownCourses = await Course.find({ teacher: req.user._id }).distinct('_id');
    filter.course = { $in: ownCourses };
  }
  const coupons = await Coupon.find(filter).sort({ createdAt: -1 }).limit(200).populate('course', 'title').lean();
  res.json({ coupons });
});

// POST /api/coupons
export const createCoupon = asyncHandler(async (req, res) => {
  const body = couponSchema.parse(req.body);
  if (req.user.role === 'teacher') {
    if (!body.course) throw httpError(400, 'Choose one of your courses for this code');
    const course = await Course.findById(body.course).select('teacher').lean();
    if (!course || String(course.teacher) !== String(req.user._id)) throw httpError(403, 'You can only make codes for your own courses');
  }
  const coupon = await Coupon.create({ ...body, code: body.code.toUpperCase(), createdBy: req.user._id, course: body.course ?? null });
  res.status(201).json({ coupon });
});

// PATCH /api/coupons/:id  -> switch a code off (it cannot be used any more)
export const deactivateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw httpError(404, 'Coupon not found');
  if (req.user.role === 'teacher') {
    const course = await Course.findById(coupon.course).select('teacher').lean();
    if (!course || String(course.teacher) !== String(req.user._id)) throw httpError(403, 'Not your coupon');
  }
  coupon.active = false;
  await coupon.save();
  res.json({ coupon });
});
