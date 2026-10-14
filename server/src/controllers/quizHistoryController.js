import QuizAttempt from '../models/QuizAttempt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta } from '../utils/pagination.js';

// GET /api/quiz-attempts/mine?page=&limit=  -> every quiz attempt of the logged-in student, newest first
// Plus a summary: attempts, lessons passed, average score.
export const myQuizAttempts = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const filter = { student: req.user._id };
  const [rows, total, all] = await Promise.all([
    QuizAttempt.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('lesson', 'title')
      .populate('course', 'title')
      .lean(),
    QuizAttempt.countDocuments(filter),
    QuizAttempt.find(filter).select('lesson passed score').lean(),
  ]);

  const passedLessons = new Set(all.filter((a) => a.passed).map((a) => String(a.lesson)));
  const average = all.length ? all.reduce((s, a) => s + a.score, 0) / all.length : 0;

  res.json({
    attempts: rows.map((a) => ({
      _id: a._id,
      lesson: a.lesson ? { _id: a.lesson._id, title: a.lesson.title } : null,
      course: a.course ? { _id: a.course._id, title: a.course.title } : null,
      score: a.score,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      passed: a.passed,
      createdAt: a.createdAt,
    })),
    summary: { attempts: all.length, lessonsPassed: passedLessons.size, averageScore: Math.round(average) },
    ...pageMeta(page, limit, total),
  });
});
