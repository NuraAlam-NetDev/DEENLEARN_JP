import mongoose from 'mongoose';

// A student's private note on a lesson. One note per student per lesson.
const noteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    // Denormalized so a course's notes can be listed without a join
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    content: { type: String, required: true, trim: true, maxlength: 8000 },
  },
  { timestamps: true }
);

noteSchema.index({ student: 1, lesson: 1 }, { unique: true });
// "My notes", most recently edited first
noteSchema.index({ student: 1, updatedAt: -1 });
noteSchema.index({ student: 1, course: 1, updatedAt: -1 });

export default mongoose.model('Note', noteSchema);
