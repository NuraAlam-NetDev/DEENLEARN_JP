import mongoose from 'mongoose';

// Every refund: which payment, how much, how (Stripe or manual cash), who made it, and why
const refundSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['JPY', 'USD'], required: true },
    method: { type: String, enum: ['stripe', 'manual'], required: true },
    stripeRefundId: { type: String, default: '' },
    reason: { type: String, required: true, maxlength: 300 },
    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    refundedByRole: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refundSchema.index({ createdAt: -1 });

export default mongoose.model('Refund', refundSchema);
