import mongoose from 'mongoose';

// Discount codes. Admins can make codes for any course; teachers only for their own courses.
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    kind: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 1 }, // percent (1-100) or an amount in the currency
    currency: { type: String, enum: ['JPY', 'USD', 'ANY'], default: 'ANY' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null }, // null = any course
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
    maxUses: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    uses: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
