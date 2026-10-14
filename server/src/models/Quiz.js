import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 300 },
    // NEVER send this to students. See serializeQuizForStudent in services/quizGrading.js.
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    options: { type: [optionSchema], default: [] },
    // Shown to the student after they submit
    explanation: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    // Denormalized so a course's quizzes can be listed without a join
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    title: { type: String, trim: true, maxlength: 150, default: 'Quiz' },
    // Percentage (0-100) a student needs to pass
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    questions: { type: [questionSchema], default: [] },
    // Students only see published quizzes (a draft lets the teacher build it step by step)
    published: { type: Boolean, default: false },
    // When true, a student must pass this quiz before the lesson can be marked complete
    required: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One quiz per lesson
quizSchema.index({ lesson: 1 }, { unique: true });
// "Required quizzes of this course" (certificate eligibility)
quizSchema.index({ course: 1, required: 1, published: 1 });

export default mongoose.model('Quiz', quizSchema);
