import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';

// PATCH /api/auth/me/details  (students)
export const updateDetails = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { details: req.body }, { new: true, runValidators: true });
  res.json({ user });
});

const digits = (s) => String(s || '').replace(/[^0-9]/g, '');

// GET /api/admin/student-contacts?q=&page=&limit=&format=csv   (admins and the super admin)
export const listStudentContacts = asyncHandler(async (req, res) => {
  const { q, page, limit, format } = req.query;
  const filter = { role: 'student' };
  if (q) filter.$or = [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { email: { $regex: escapeRegex(q), $options: 'i' } }];

  const shape = (u) => {
    const d = u.details || {};
    const number = d.contactMethod === 'email' ? '' : d.contactNumber || '';
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      address: d.address || '',
      city: d.city || '',
      country: d.country || '',
      contactMethod: d.contactMethod || 'email',
      contactOther: d.contactOther || '',
      contactNumber: number,
      whatsappLink: d.contactMethod === 'whatsapp' && digits(number) ? `https://wa.me/${digits(number)}` : '',
      updatedAt: u.updatedAt,
    };
  };

  if (format === 'csv') {
    const all = await User.find(filter).sort({ name: 1 }).select('name email details updatedAt').lean();
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = all.map(shape).map((r) =>
      [r.name, r.email, r.address, r.city, r.country, r.contactMethod, r.contactOther, r.contactNumber].map(esc).join(','));
    const csv = ['Name,Email,Address,City,Country,Contact method,Other app,Contact number', ...rows].join('\n');
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="student-contacts.csv"' });
    return res.send('\uFEFF' + csv);
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).select('name email details updatedAt').lean(),
    User.countDocuments(filter),
  ]);
  res.json({ contacts: users.map(shape), ...pageMeta(page, limit, total) });
});
