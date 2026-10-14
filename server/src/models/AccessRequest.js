import mongoose from 'mongoose';

// A student asks the admin for free access to a course they still owe on
const accessRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    // access: a student with an installment plan asks for free access to the lessons.
    // enrollment: a student who has not bought the course asks to join it for free.
    type: { type: String, enum: ['access', 'enrollment'], default: 'access' },
    reason: { type: String, default: '', maxlength: 300 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    decisionNote: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true }
);

accessRequestSchema.index({ student: 1, course: 1, status: 1 });

export default mongoose.model('AccessRequest', accessRequestSchema);
