import mongoose from 'mongoose';

// One document per active refresh token (identified by its JWT "jti").
// Deleting the document revokes the token; MongoDB removes expired ones itself.
const refreshTokenSchema = new mongoose.Schema(
  {
    jti: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: auto-delete once expiresAt has passed
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
