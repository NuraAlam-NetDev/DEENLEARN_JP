import mongoose from 'mongoose';

// Q&A under a lesson. A question has parent = null; a reply points at its question (one level only).
const postSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    resolved: { type: Boolean, default: false }, // questions only
  },
  { timestamps: true }
);

postSchema.index({ lesson: 1, parent: 1, createdAt: -1 });
postSchema.index({ parent: 1, createdAt: 1 });
postSchema.index({ course: 1 });

export default mongoose.model('Post', postSchema);
