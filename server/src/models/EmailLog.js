import mongoose from 'mongoose';

// Every email the app sends: who it went to, what it said, who caused it, and whether it went out
const emailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, maxlength: 254 },
    subject: { type: String, default: '', maxlength: 300 },
    body: { type: String, default: '', maxlength: 4000 },
    kind: {
      type: String,
      enum: ['notification', 'payment', 'installment', 'manual', 'bulk', 'password_reset', 'system'],
      default: 'system',
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // admin who pressed send
    sentByRole: { type: String, default: '' },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent' },
    error: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ kind: 1, createdAt: -1 });

export default mongoose.model('EmailLog', emailLogSchema);
