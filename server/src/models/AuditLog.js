import mongoose from 'mongoose';

// One row per change made by an admin or the super admin. Written automatically, never edited.
const auditSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true }, // e.g. "PATCH /users/:id/ban"
  targetId: { type: String, default: '' },  // the :id from the URL, if any
  status: { type: Number, required: true }, // HTTP status of the response
  keys: [String],                           // names of the body fields only. Values are never stored (passwords, etc.)
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.model('AuditLog', auditSchema);
