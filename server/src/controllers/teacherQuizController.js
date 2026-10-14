import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta } from '../utils/pagination.js';

// GET /api/teacher/lessons/:id/quiz   (includes which options are correct)
// { quiz: null } when the lesson has none yet.
export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ lesson: req.lesson._id }).lean();
  res.json({ quiz: quiz ?? null });
});

// PUT /api/teacher/lessons/:id/quiz   (create or replace; the body is the whole quiz)
export const saveQuiz = asyncHandler(async (req, res) => {
  let quiz = await Quiz.findOne({ lesson: req.lesson._id });
  if (!quiz) quiz = new Quiz({ lesson: req.lesson._id, course: req.course._id });
  const created = quiz.isNew;

  const { title, passingScore, published, required, questions } = req.body;
  quiz.set({ title, passingScore, published, required, questions });
  await quiz.save();

  res.status(created ? 201 : 200).json({ quiz });
});

// DELETE /api/teacher/lessons/:id/quiz   (also deletes the students' attempts)
export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ lesson: req.lesson._id }).select('_id').lean();
  if (!quiz) throw httpError(404, 'This lesson has no quiz');

  await Promise.all([Quiz.deleteOne({ _id: quiz._id }), QuizAttempt.deleteMany({ quiz: quiz._id })]);
  res.json({ message: 'Quiz deleted' });
});

// GET /api/teacher/lessons/:id/quiz/results?page=&limit=
// One row per student (best score, attempts), most recent activity first, plus overall numbers.
export const getQuizResults = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const quiz = await Quiz.findOne({ lesson: req.lesson._id }).select('_id passingScore').lean();
  if (!quiz) throw httpError(404, 'This lesson has no quiz');

  const [facet] = await QuizAttempt.aggregate([
    { $match: { quiz: quiz._id } },
    {
      $group: {
        _id: '$student',
        attempts: { $sum: 1 },
        bestScore: { $max: '$score' },
        passed: { $max: { $cond: ['$passed', 1, 0] } },
        lastAttemptAt: { $max: '$createdAt' },
      },
    },
    { $sort: { lastAttemptAt: -1, _id: 1 } },
    {
      $facet: {
        rows: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        totals: [
          {
            $group: {
              _id: null,
              students: { $sum: 1 },
              attempts: { $sum: '$attempts' },
              passedStudents: { $sum: '$passed' },
              averageBest: { $avg: '$bestScore' },
            },
          },
        ],
      },
    },
  ]);

  const totals = facet.totals[0] ?? { students: 0, attempts: 0, passedStudents: 0, averageBest: 0 };
  const users = await User.find({ _id: { $in: facet.rows.map((r) => r._id) } })
    .select('name')
    .lean();
  const names = new Map(users.map((u) => [String(u._id), u.name]));

  res.json({
    passingScore: quiz.passingScore,
    summary: {
      students: totals.students,
      attempts: totals.attempts,
      passRate: totals.students ? Math.round((totals.passedStudents / totals.students) * 100) : 0,
      averageBestScore: Math.round(totals.averageBest || 0),
    },
    results: facet.rows.map((r) => ({
      student: { _id: r._id, name: names.get(String(r._id)) ?? 'Deleted user' },
      attempts: r.attempts,
      bestScore: r.bestScore,
      passed: !!r.passed,
      lastAttemptAt: r.lastAttemptAt,
    })),
    ...pageMeta(page, limit, totals.students),
  });
});
