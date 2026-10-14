import mongoose from 'mongoose';

// One installment: how much is due, when, and how much has been paid so far
const installmentSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 }, // 0 when the part was waived and nothing was paid
    dueAt: { type: Date, required: true },
    paid: { type: Number, default: 0, min: 0 },
    reminded: { type: Boolean, default: false }, // overdue notice already sent
  },
  { _id: false }
);

// A student's payment plan for one course: the price locked at the first payment,
// split into installments. A plan with one installment is simply "paid in full".
const planSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    currency: { type: String, enum: ['JPY', 'USD'], required: true },
    total: { type: Number, required: true, min: 1 },
    graceDays: { type: Number, default: 7 },
    // normal: lessons close after the grace period. free: the admin has given full access.
    accessMode: { type: String, enum: ['normal', 'free'], default: 'normal' },
    emailOnOverdue: { type: Boolean, default: true }, // automatic overdue emails on or off
    waivedTotal: { type: Number, default: 0, min: 0 }, // money the admin forgave, in total
    policyBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    policyAt: { type: Date, default: null },
    schedule: { type: [installmentSchema], default: [] },
  },
  { timestamps: true }
);

planSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Plan', planSchema);
