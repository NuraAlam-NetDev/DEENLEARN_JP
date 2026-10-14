import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    // The accepted answer (set by the asker or the course's teacher). At most one per question.
    accepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

replySchema.index({ question: 1, createdAt: 1 });
replySchema.index({ course: 1 });

export default mongoose.model('Reply', replySchema);
