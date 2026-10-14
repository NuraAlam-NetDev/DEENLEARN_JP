import mongoose from 'mongoose';

// A private link a student gives to a parent or guardian. Read-only progress, no login.
// Only a hash of the link's secret is stored. The student can revoke it at any time.
const parentLinkSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    label: { type: String, default: '', maxlength: 60 },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('ParentLink', parentLinkSchema);
