import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { findEnrolledLesson } from '../services/courseAccess.js';
import { buildReview, gradeAttempt, serializeQuizForStudent } from '../services/quizGrading.js';
import { notify } from '../utils/notify.js';

const HISTORY = 10;

// GET /api/lessons/:id/quiz
// The lesson's published quiz WITHOUT the answers, plus this student's attempts.
// { quiz: null } when the lesson has no (published) quiz.
export const getQuiz = asyncHandler(async (req, res) => {
  const lesson = await findEnrolledLesson(req.user._id, req.params.id);
  const quiz = await Quiz.findOne({ lesson: lesson._id, published: true }).lean();
  if (!quiz) return res.json({ quiz: null });

  const mine = { student: req.user._id, quiz: quiz._id };
  const [history, totals] = await Promise.all([
    QuizAttempt.find(mine)
      .sort({ createdAt: -1 })
      .limit(HISTORY)
      .select('score passed correctCount totalQuestions createdAt')
      .lean(),
    QuizAttempt.aggregate([
      { $match: mine },
      {
        $group: {
          _id: null,
          attempts: { $sum: 1 },
          bestScore: { $max: '$score' },
          passed: { $max: { $cond: ['$passed', 1, 0] } },
        },
      },
    ]),
  ]);

  const t = totals[0];
  res.json({
    quiz: serializeQuizForStudent(quiz),
    attempts: history,
    summary: {
      attempts: t?.attempts ?? 0,
      bestScore: t ? t.bestScore : null,
      passed: !!t?.passed,
    },
  });
});

// POST /api/lessons/:id/quiz/attempts   body: { answers: [{ question, selected: [optionId] }] }
// Grades on the server (the browser never learns the answers beforehand), saves the attempt
// and returns the result with the answer key and explanations.
export const submitAttempt = asyncHandler(async (req, res) => {
  const lesson = await findEnrolledLesson(req.user._id, req.params.id);
  const quiz = await Quiz.findOne({ lesson: lesson._id, published: true }).lean();
  if (!quiz) throw httpError(404, 'This lesson has no quiz');

  const graded = gradeAttempt(quiz, req.body.answers);
  const attempt = await QuizAttempt.create({
    student: req.user._id,
    quiz: quiz._id,
    lesson: lesson._id,
    course: lesson.course,
    answers: graded.answers,
    correctCount: graded.correctCount,
    totalQuestions: graded.totalQuestions,
    score: graded.score,
    passed: graded.passed,
  });

  await notify(req.user._id, {
    type: 'quiz',
    title: graded.passed ? 'Quiz passed' : 'Quiz not passed yet',
    body: `You scored ${graded.score}%` + (graded.passed ? '.' : ` (pass mark ${quiz.passingScore}%). Review the lesson and try again.`),
    link: `/student/courses/${lesson.course}/lessons/${lesson._id}`,
    email: false,
  });

  res.status(201).json({
    attempt: {
      _id: attempt._id,
      score: attempt.score,
      passed: attempt.passed,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      passingScore: quiz.passingScore,
      createdAt: attempt.createdAt,
    },
    review: buildReview(quiz, graded.answers),
  });
});
