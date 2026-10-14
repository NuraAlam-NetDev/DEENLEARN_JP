import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    // Denormalized so course progress can be computed without a join
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// One progress record per student per lesson
progressSchema.index({ student: 1, lesson: 1 }, { unique: true });
// Count completed lessons for a student in a course
progressSchema.index({ student: 1, course: 1, completed: 1 });

// Keep completedAt in sync with completed
progressSchema.pre('save', function (next) {
  if (this.isModified('completed')) {
    this.completedAt = this.completed ? new Date() : undefined;
  }
  next();
});

export default mongoose.model('Progress', progressSchema);
