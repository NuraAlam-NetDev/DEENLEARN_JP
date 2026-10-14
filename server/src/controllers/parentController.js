import crypto from 'crypto';
import mongoose from 'mongoose';
import ParentLink from '../models/ParentLink.js';
import Enrollment from '../models/Enrollment.js';
import Certificate from '../models/Certificate.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';

const DAYS = 90;
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

// POST /api/parent-links  body: { label? }  -> the link is shown once; only its hash is kept
export const createParentLink = asyncHandler(async (req, res) => {
  const token = crypto.randomBytes(24).toString('base64url');
  const link = await ParentLink.create({
    student: req.user._id,
    tokenHash: sha256(token),
    label: req.body.label || '',
    expiresAt: new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000),
  });
  res.status(201).json({ link: { _id: link._id, label: link.label, expiresAt: link.expiresAt }, url: `${clientUrl()}/parent/${token}` });
});

// GET /api/parent-links  (the student's own links)
export const listParentLinks = asyncHandler(async (req, res) => {
  const links = await ParentLink.find({ student: req.user._id, revoked: false }).sort({ createdAt: -1 }).select('label expiresAt createdAt').lean();
  res.json({ links });
});

// DELETE /api/parent-links/:id
export const revokeParentLink = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid link');
  const link = await ParentLink.findOne({ _id: req.params.id, student: req.user._id });
  if (!link) throw httpError(404, 'Link not found');
  link.revoked = true;
  await link.save();
  res.json({ ok: true });
});

// GET /api/parent/:token  (public, read-only). Shows progress and certificates only: no email, no payments.
export const parentView = asyncHandler(async (req, res) => {
  const link = await ParentLink.findOne({ tokenHash: sha256(req.params.token), revoked: false }).lean();
  if (!link || new Date(link.expiresAt) < new Date()) {
    throw httpError(404, 'This link is no longer valid. Ask the student for a new one.');
  }
  const student = await User.findById(link.student).select('name').lean();
  if (!student) throw httpError(404, 'This link is no longer valid.');

  const [enrollments, certificates, lastProgress] = await Promise.all([
    Enrollment.find({ student: link.student }).populate('course', 'title').sort({ createdAt: -1 }).lean(),
    Certificate.find({ student: link.student }).sort({ issuedAt: -1 }).select('courseTitle issuedAt').lean(),
    Progress.findOne({ student: link.student }).sort({ updatedAt: -1 }).select('updatedAt').lean(),
  ]);

  res.json({
    studentName: student.name,
    courses: enrollments
      .filter((e) => e.course)
      .map((e) => ({ title: e.course.title, progress: e.progress, completed: e.progress >= 100 })),
    certificates: certificates.map((c) => ({ courseTitle: c.courseTitle, issuedAt: c.issuedAt })),
    lastActivityAt: lastProgress?.updatedAt ?? null,
    generatedAt: new Date(),
  });
});
