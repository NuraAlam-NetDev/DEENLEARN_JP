import mongoose from 'mongoose';

// In-app notifications (also sent by email when it matters)
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, maxlength: 40 },
    title: { type: String, required: true, maxlength: 150 },
    body: { type: String, default: '', maxlength: 500 },
    link: { type: String, default: '', maxlength: 200 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
