import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    // Denormalized so a course's bookmarks can be listed without a join
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  },
  { timestamps: true }
);

// One bookmark per student per lesson
bookmarkSchema.index({ student: 1, lesson: 1 }, { unique: true });
// "My bookmarks", newest first
bookmarkSchema.index({ student: 1, createdAt: -1 });
bookmarkSchema.index({ student: 1, course: 1 });

export default mongoose.model('Bookmark', bookmarkSchema);
