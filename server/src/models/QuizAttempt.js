import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, required: true },
    selected: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    // Graded at submit time, so editing the quiz later never rewrites history
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    answers: { type: [answerSchema], default: [] },
    correctCount: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },
    // Percentage 0-100
    score: { type: Number, required: true, min: 0, max: 100 },
    passed: { type: Boolean, required: true },
  },
  { timestamps: true }
);

// A student's attempts at a quiz, newest first
quizAttemptSchema.index({ student: 1, quiz: 1, createdAt: -1 });
// "Did this student pass?" (certificate check) and the teacher's results table
quizAttemptSchema.index({ quiz: 1, student: 1, passed: 1 });
quizAttemptSchema.index({ course: 1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
