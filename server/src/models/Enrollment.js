import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    // Percentage 0-100 (completed lessons / total lessons)
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// A student can enroll in a course only once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
// "Who is enrolled in my course?"
enrollmentSchema.index({ course: 1 });

export default mongoose.model('Enrollment', enrollmentSchema);
