import mongoose from 'mongoose';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Plan from '../models/Plan.js';
import Enrollment from '../models/Enrollment.js';
import Refund from '../models/Refund.js';
import Coupon from '../models/Coupon.js';
import Course from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { sendEmail } from '../utils/email.js';
import { overdueInstallments, remainingOf } from '../services/plans.js';

const MAX_BULK = 2000;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// POST /api/admin/bulk-email  body: { audience: 'students' | 'course', courseId?, subject, body }
// Answers at once with the number of recipients. The emails go out one by one in the background,
// and every one is written to the email log (kind "bulk").
export const bulkEmail = asyncHandler(async (req, res) => {
  const { audience, courseId, subject, body } = req.body;

  let ids;
  if (audience === 'course') {
    if (!mongoose.isValidObjectId(courseId)) throw httpError(400, 'Choose a course');
    ids = await Enrollment.find({ course: courseId }).distinct('student');
  } else {
    ids = await User.find({ role: 'student', status: 'active' }).distinct('_id');
  }
  const users = await User.find({ _id: { $in: ids }, status: { $ne: 'banned' } }).select('name email').lean();
  if (!users.length) throw httpError(400, 'No students to send to');
  if (users.length > MAX_BULK) throw httpError(400, `Too many recipients for one send (the limit is ${MAX_BULK}). Send to one course at a time.`);

  const by = { sentBy: req.user._id, sentByRole: req.user.role };
  setImmediate(async () => {
    for (const u of users) {
      try {
        await sendEmail({
          kind: 'bulk', to: u.email, subject,
          text: `Hi ${u.name},\n\n${body}\n\nDeenlearn`,
          userId: u._id, ...by,
        });
      } catch (err) {
        console.error('bulk email failed:', err.message);
      }
      await pause(120); // gentle pace, so the mail server does not block us
    }
  });
  res.status(202).json({ recipients: users.length, message: 'Sending in the background. Check the Email log.' });
});

// GET /api/admin/coupons/report  -> every discount code: how many orders used it, the discount given, the revenue
export const couponReport = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).limit(200).populate('course', 'title').lean();
  const codes = coupons.map((c) => c.code);
  const rows = await Order.aggregate([
    { $match: { couponCode: { $in: codes }, status: 'approved' } },
    { $group: { _id: { code: '$couponCode', currency: '$currency' }, orders: { $sum: 1 }, discount: { $sum: '$discount' }, revenue: { $sum: '$amount' } } },
  ]);

  const byCode = {};
  for (const r of rows) {
    const entry = (byCode[r._id.code] ??= { orders: 0, byCurrency: {} });
    entry.orders += r.orders;
    entry.byCurrency[r._id.currency] = { orders: r.orders, discount: r.discount, revenue: r.revenue };
  }

  res.json({
    coupons: coupons.map((c) => ({
      _id: c._id,
      code: c.code,
      kind: c.kind,
      value: c.value,
      currency: c.currency,
      course: c.course?.title ?? 'Any course',
      active: c.active,
      expiresAt: c.expiresAt,
      maxUses: c.maxUses,
      reserved: c.uses,
      orders: byCode[c.code]?.orders ?? 0,
      byCurrency: byCode[c.code]?.byCurrency ?? {},
    })),
  });
});

const ascii = (s) => String(s ?? '').replace(/[^\x20-\x7E]/g, '?');
const money = (n, c) => (c === 'JPY' ? `${Number(n).toLocaleString()} JPY` : `${Number(n).toFixed(2)} ${c}`);

// GET /api/admin/reports/monthly.pdf?month=2026-10
// Revenue (net of refunds), enrollments, new students, refunds, what is still owed, overdue, top courses.
export const monthlyReportPdf = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [yr, mo] = month.split('-').map(Number);
  const start = new Date(yr, mo - 1, 1);
  const end = new Date(yr, mo, 1);
  const inMonth = { $gte: start, $lt: end };

  const [revenue, enrollments, newStudents, refunds, plans, topCourses] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'approved', reviewedAt: inMonth } },
      { $group: { _id: '$currency', gross: { $sum: '$amount' }, refunded: { $sum: '$refundedAmount' }, count: { $sum: 1 } } },
    ]),
    Enrollment.countDocuments({ createdAt: inMonth }),
    User.countDocuments({ role: 'student', createdAt: inMonth }),
    Refund.aggregate([
      { $match: { createdAt: inMonth } },
      { $group: { _id: '$currency', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Plan.find({ $expr: { $lt: [{ $sum: '$schedule.paid' }, '$total'] } }).limit(5000).lean(),
    Order.aggregate([
      { $match: { status: 'approved', reviewedAt: inMonth } },
      { $group: { _id: '$course', net: { $sum: { $subtract: ['$amount', '$refundedAmount'] } }, count: { $sum: 1 } } },
      { $sort: { net: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const owed = {};
  let overdue = 0;
  const check = new Date();
  for (const p of plans) {
    owed[p.currency] = (owed[p.currency] || 0) + remainingOf(p);
    if (p.accessMode !== 'free' && overdueInstallments(p, check).length) overdue += 1;
  }
  const titles = new Map((await Course.find({ _id: { $in: topCourses.map((c) => c._id) } }).select('title').lean()).map((c) => [String(c._id), c.title]));

  // ---- the PDF ----
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.1, 0.1, 0.1);
  const muted = rgb(0.45, 0.45, 0.45);
  let y = 790;
  const line = (text, { size = 11, f = font, color = ink, gap = 18 } = {}) => {
    page.drawText(ascii(text), { x: 50, y, size, font: f, color });
    y -= gap;
  };
  const section = (title) => { y -= 8; line(title, { size: 13, f: bold, gap: 22 }); };

  line('Deenlearn - Monthly report', { size: 18, f: bold, gap: 26 });
  line(`Month: ${month}   (generated ${now.toISOString().slice(0, 10)})`, { color: muted, gap: 28 });

  section('Revenue (approved payments, net of refunds)');
  if (!revenue.length) line('No approved payments this month.');
  for (const r of revenue) {
    const net = r.gross - (r.refunded || 0);
    line(`${r._id}: ${money(net, r._id)}   (gross ${money(r.gross, r._id)}, refunds ${money(r.refunded || 0, r._id)}, ${r.count} payments)`);
  }

  section('Refunds');
  if (!refunds.length) line('No refunds this month.');
  for (const r of refunds) line(`${r._id}: ${money(r.amount, r._id)} in ${r.count} refund(s)`);

  section('Enrollment and students');
  line(`New enrollments: ${enrollments}`);
  line(`New students: ${newStudents}`);

  section('Still owed (today, all students)');
  if (!Object.keys(owed).length) line('Nothing owed.');
  for (const [cur, amt] of Object.entries(owed)) line(`${cur}: ${money(amt, cur)}`);
  line(`Students with an overdue installment (past grace): ${overdue}`);

  section('Top courses this month');
  if (!topCourses.length) line('No sales this month.');
  for (const c of topCourses) {
    line(`${ascii(titles.get(String(c._id)) || 'Course')}: ${c.count} payment(s)`, { gap: 16 });
  }

  page.drawText('Generated automatically by Deenlearn. Times are the server time zone.', { x: 50, y: 40, size: 8, font, color: muted });

  const bytes = await pdf.save();
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="deenlearn-report-${month}.pdf"`,
    'Cache-Control': 'private, no-store',
  });
  res.send(Buffer.from(bytes));
});
