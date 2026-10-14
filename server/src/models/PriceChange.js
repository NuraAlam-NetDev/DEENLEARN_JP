import mongoose from 'mongoose';

// One row each time a course price (JPY or USD) is changed: who, when, from what to what
const priceChangeSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    currency: { type: String, enum: ['JPY', 'USD'], required: true },
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByRole: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

priceChangeSchema.index({ createdAt: -1 });

export default mongoose.model('PriceChange', priceChangeSchema);
