import Course from '../models/Course.js';
import Order from '../models/Order.js';
import Enrollment from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { applyCoupon } from './couponController.js';
import { startStripeCheckout, verifyStripeSignature, stripeConfigured, toStripeAmount } from '../services/payments/stripe.js';
import {
  planFor, remainingOf, nextInstallment, buildSchedule, finishApproval,
  INSTALLMENT_OPTIONS, MIN_PAYMENT,
} from '../services/plans.js';

import { formatMoney } from '../utils/money.js';
import { notify } from '../utils/notify.js';

const clientUrl = () =>
  (process.env.CLIENT_URL || (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0]).trim();
const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v || ''));

// Price of the course in one currency. 0 means not sold in that currency.
const priceFor = (course, currency) => (currency === 'JPY' ? course.priceJPY : course.priceUSD);

// Checks a payment amount: a whole number, not more than what is owed, and not below the minimum
// unless it clears the balance.
function checkAmount(amount, owed, currency) {
  if (!Number.isInteger(amount) || amount < 1) throw httpError(400, 'Enter a whole amount');
  if (amount > owed) throw httpError(400, `The amount is more than the balance (${formatMoney(owed, currency)})`);
  if (amount < owed && amount < MIN_PAYMENT[currency]) {
    throw httpError(400, `The smallest partial payment is ${formatMoney(MIN_PAYMENT[currency], currency)}`);
  }
}

// Kept for compatibility: marks an order as paid, waiting for approval
export async function markAwaitingApproval(order, gatewayTxnId = '') {
  if (order.status === 'awaiting_approval' || order.status === 'approved') return order;
  order.status = 'awaiting_approval';
  order.paidAt = new Date();
  order.gatewayTxnId = String(gatewayTxnId || order.gatewayTxnId || '');
  await order.save();
  return order;
}

// Blocks the free enroll route for paid courses. Used in routes/courses.js.
export const requireFreeCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).select('published priceJPY priceUSD').lean();
  if (course?.published && (course.priceJPY > 0 || course.priceUSD > 0)) {
    throw httpError(402, 'This course is paid. Buy it to enroll.');
  }
  next();
});

// POST /api/payments/checkout
// body: { courseId, provider: 'stripe' | 'cash', currency?, installments?: 1|2|3|6, amount?, couponCode? }
// First payment: chooses the number of installments and an optional amount (default: the first installment).
// Later payments: pays the next installment (default) or any amount up to the balance.
export const checkout = asyncHandler(async (req, res) => {
  const { courseId, provider, amount: requested, couponCode } = req.body;
  const currency = provider === 'cash' ? 'JPY' : req.body.currency || 'JPY';

  const course = await Course.findById(courseId);
  if (!course || !course.published) throw httpError(404, 'Course not found');

  const plan = await planFor(req.user._id, course._id);
  if (!plan) {
    const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
    if (enrolled) throw httpError(409, 'You are already enrolled in this course');
  }

  // One open payment per course: waiting for approval, waiting for the teacher, or started in the last hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const open = await Order.exists({
    student: req.user._id,
    course: course._id,
    $or: [
      { status: 'awaiting_approval' },
      { status: 'cash_pending' },
      { status: 'pending', createdAt: { $gte: hourAgo } },
    ],
  });
  if (open) throw httpError(409, 'You already have a payment for this course in progress');

  let amount;
  let planTotal = 0;
  let installments = 1;
  let couponUsed = '';
  let discount = 0;

  if (plan) {
    // Paying the rest of an existing plan
    if (couponCode) throw httpError(400, 'A discount code can only be used for the first payment');
    if (plan.currency !== currency) {
      throw httpError(400, `This course is paid in ${plan.currency}. Choose ${plan.currency}.`);
    }
    const owed = remainingOf(plan);
    if (owed <= 0) throw httpError(409, 'This course is already paid in full');
    const next = nextInstallment(plan);
    const suggested = next ? next.amount - next.paid : owed;
    amount = requested ? Number(requested) : Math.min(suggested, owed);
    checkAmount(amount, owed, currency);
  } else {
    // First payment: the price is taken from the course on the server
    const base = priceFor(course, currency);
    if (!base) throw httpError(400, `This course is not priced in ${currency}`);

    let total = base;
    if (couponCode) {
      const applied = await applyCoupon({ code: couponCode, course, currency, amount: base });
      couponUsed = applied.code;
      discount = applied.discount;
      total = applied.finalAmount;
    }

    installments = INSTALLMENT_OPTIONS.includes(Number(req.body.installments)) ? Number(req.body.installments) : 1;
    planTotal = total;
    const firstInstallment = buildSchedule(total, installments, new Date())[0].amount;
    amount = requested ? Number(requested) : firstInstallment;
    checkAmount(amount, total, currency);
  }

  const common = { student: req.user._id, course: course._id, amount, planTotal, installments, couponCode: couponUsed, discount };

  if (provider === 'cash') {
    // No gateway: the student pays the teacher in person. The teacher confirms next.
    const order = await Order.create({ ...common, provider: 'cash', currency: 'JPY', status: 'cash_pending' });
    await notify(course.teacher, {
      type: 'payment',
      title: 'Cash payment to confirm',
      body: `A student will pay ${formatMoney(order.amount, order.currency)} in cash for ${course.title}. Confirm it when the money arrives.`,
      link: '/teacher/cash',
    });
    return res.status(201).json({ orderId: order._id, status: order.status });
  }

  if (!stripeConfigured()) throw httpError(503, 'Card payment is not set up yet');

  const order = await Order.create({ ...common, provider: 'stripe', currency });
  try {
    const session = await startStripeCheckout({ order, course, clientUrl: clientUrl() });
    order.providerRef = session.id;
    await order.save();
    return res.status(201).json({ orderId: order._id, url: session.url });
  } catch (err) {
    order.status = 'failed';
    await order.save();
    throw err;
  }
});

// GET /api/payments/orders/:id  (the result page polls this)
export const orderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, student: req.user._id }).lean();
  if (!order) throw httpError(404, 'Order not found');
  res.json({
    status: order.status,
    courseId: order.course,
    amount: order.amount,
    currency: order.currency,
    enrolled: order.status === 'approved',
    rejectReason: order.status === 'rejected' ? order.rejectReason : '',
  });
});

// POST /api/payments/stripe/webhook  (raw body. Mounted in app.js BEFORE express.json)
// A card payment that Stripe confirms is approved straight away (no admin step).
export const stripeWebhook = asyncHandler(async (req, res) => {
  if (!verifyStripeSignature(req.body, req.headers['stripe-signature'])) {
    throw httpError(400, 'Invalid signature');
  }

  const event = JSON.parse(req.body.toString('utf8'));
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId || session.client_reference_id;
    const order = isObjectId(orderId) ? await Order.findById(orderId) : null;

    if (order && order.provider === 'stripe' && !['awaiting_approval', 'approved'].includes(order.status)) {
      // Money must match exactly: same amount (in the currency's smallest unit) and same currency
      const paidOk =
        session.payment_status === 'paid' &&
        Number(session.amount_total) === toStripeAmount(order.amount, order.currency) &&
        String(session.currency).toUpperCase() === order.currency;
      if (paidOk) {
        order.gatewayTxnId = String(session.payment_intent || '');
        order.paidAt = new Date();
        await finishApproval(order);
      } else {
        order.status = 'failed';
        await order.save();
      }
    }
  }
  res.json({ received: true });
});
