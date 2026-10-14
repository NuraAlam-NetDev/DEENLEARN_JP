import mongoose from 'mongoose';

// A question asked under a lesson (the Q&A / discussion section). Answers live in Reply.
const questionSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    // Denormalized so a teacher can see every question of a course in one query
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, trim: true, maxlength: 3000, default: '' },
    // Kept in step with the Reply collection ($inc on create / delete)
    replyCount: { type: Number, default: 0, min: 0 },
    // True while one of the replies is marked as the accepted answer
    answered: { type: Boolean, default: false },
    // Newest activity first in lists
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

questionSchema.index({ lesson: 1, lastActivityAt: -1 });
questionSchema.index({ course: 1, answered: 1, lastActivityAt: -1 });

export default mongoose.model('Question', questionSchema);
