import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { calcPercent } from '../utils/progress.js';

const str = (id) => String(id);
const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// One student's full learning record.
//   courseIds: null = every course (the student's own view, or the admin view)
//              array = only these courses (a teacher sees only their own courses)
// Returns null when the student is not a student, or has nothing in the given scope.
export async function buildStudentReport({ studentId, courseIds = null }) {
  const student = await User.findById(studentId).select('name email role').lean();
  if (!student || student.role !== 'student') return null;

  const scope = courseIds ? { course: { $in: courseIds } } : {};
  const enrollments = await Enrollment.find({ student: studentId, ...scope })
    .populate({
      path: 'course',
      select: 'title category published teacher',
      populate: { path: 'teacher', select: 'name' },
    })
    .lean();
  if (courseIds && enrollments.length === 0) return null;

  const enrolled = enrollments.filter((e) => e.course);
  const ids = enrolled.map((e) => e.course._id);

  const [lessons, doneRows, attempts, quizzes, certificates] = await Promise.all([
    Lesson.find({ course: { $in: ids } }).select('title course order').sort({ order: 1 }).lean(),
    Progress.find({ student: studentId, completed: true, course: { $in: ids } }).select('course').lean(),
    QuizAttempt.find({ student: studentId, course: { $in: ids } }).sort({ createdAt: -1 }).lean(),
    Quiz.find({ course: { $in: ids } }).select('title lesson course passingScore required').lean(),
    Certificate.find({ student: studentId, course: { $in: ids } }).sort({ issuedAt: -1 }).lean(),
  ]);

  // ----- lookups -----
  const lessonById = new Map(lessons.map((l) => [str(l._id), l]));
  const lessonsByCourse = new Map();
  for (const l of lessons) {
    const k = str(l.course);
    lessonsByCourse.set(k, [...(lessonsByCourse.get(k) ?? []), l]);
  }
  const doneByCourse = new Map();
  for (const p of doneRows) doneByCourse.set(str(p.course), (doneByCourse.get(str(p.course)) ?? 0) + 1);

  const quizById = new Map(quizzes.map((q) => [str(q._id), q]));
  const attemptsByQuiz = new Map(); // newest first (attempts are sorted that way)
  for (const a of attempts) {
    const k = str(a.quiz);
    attemptsByQuiz.set(k, [...(attemptsByQuiz.get(k) ?? []), a]);
  }
  const passedQuizIds = new Set(attempts.filter((a) => a.passed).map((a) => str(a.quiz)));
  const certByCourse = new Map(certificates.map((c) => [str(c.course), c]));
  const courseTitle = new Map(enrolled.map((e) => [str(e.course._id), e.course.title]));

  // ----- quizzes -----
  const quizRows = quizzes
    .filter((q) => q.required || attemptsByQuiz.has(str(q._id)))
    .map((q) => {
      const list = attemptsByQuiz.get(str(q._id)) ?? [];
      const scores = list.map((a) => a.score);
      const passed = passedQuizIds.has(str(q._id));
      return {
        quizId: str(q._id),
        courseId: str(q.course),
        courseTitle: courseTitle.get(str(q.course)) ?? '',
        lessonTitle: lessonById.get(str(q.lesson))?.title ?? '',
        quizTitle: q.title,
        passingScore: q.passingScore,
        required: q.required,
        attempts: list.length,
        bestScore: scores.length ? Math.max(...scores) : null,
        latestScore: list[0]?.score ?? null,
        passed,
        lastAttemptAt: list[0]?.createdAt ?? null,
        status: passed ? 'passed' : list.length ? 'not_passed' : 'not_attempted',
      };
    });

  // ----- marks -----
  const marks = attempts.slice(0, 200).map((a) => {
    const quiz = quizById.get(str(a.quiz));
    return {
      attemptId: str(a._id),
      courseTitle: courseTitle.get(str(a.course)) ?? '',
      lessonTitle: lessonById.get(str(a.lesson))?.title ?? '',
      quizTitle: quiz?.title ?? '',
      score: a.score,
      correct: a.correctCount,
      total: a.totalQuestions,
      passed: a.passed,
      at: a.createdAt,
    };
  });

  // ----- courses -----
  const courseRows = enrolled.map((e) => {
    const cid = str(e.course._id);
    const courseLessons = lessonsByCourse.get(cid) ?? [];
    const total = courseLessons.length;
    const done = doneByCourse.get(cid) ?? 0;
    const progress = calcPercent(done, total);
    const courseQuizRows = quizRows.filter((r) => r.courseId === cid);
    const requiredPending = courseQuizRows.filter((r) => r.required && !r.passed);
    const cert = certByCourse.get(cid);

    let status = 'not_started';
    if (cert) status = 'certified';
    else if (progress === 100 && requiredPending.length === 0) status = 'ready';
    else if (progress === 100) status = 'quiz_pending';
    else if (progress > 0) status = 'in_progress';

    return {
      courseId: cid,
      title: e.course.title,
      category: e.course.category,
      teacher: e.course.teacher?.name ?? '',
      totalLessons: total,
      completedLessons: done,
      remainingLessons: total - done,
      progress,
      quizzesTaken: courseQuizRows.filter((r) => r.attempts > 0).length,
      quizzesPassed: courseQuizRows.filter((r) => r.passed).length,
      averageBestScore: avg(courseQuizRows.filter((r) => r.bestScore !== null).map((r) => r.bestScore)),
      pendingQuizzes: requiredPending.map((r) => ({ quizTitle: r.quizTitle, lessonTitle: r.lessonTitle })),
      status,
      certificateCode: cert?.code ?? null,
      enrolledAt: e.createdAt,
      lastActivityAt: e.updatedAt,
    };
  });

  // ----- certificates -----
  const issued = certificates.map((c) => ({
    code: c.code,
    courseTitle: c.courseTitle,
    recipientName: c.recipientName,
    teacherName: c.teacherName,
    issuedAt: c.issuedAt,
  }));
  const pending = courseRows
    .filter((c) => !c.certificateCode && c.status !== 'not_started')
    .map((c) => ({
      courseId: c.courseId,
      title: c.title,
      status: c.status,
      remainingLessons: c.remainingLessons,
      pendingQuizzes: c.pendingQuizzes,
    }));

  return {
    student: { _id: str(student._id), name: student.name, email: student.email },
    overview: {
      coursesEnrolled: courseRows.length,
      coursesCompleted: courseRows.filter((c) => c.progress === 100).length,
      lessonsCompleted: sum(courseRows.map((c) => c.completedLessons)),
      lessonsTotal: sum(courseRows.map((c) => c.totalLessons)),
      averageCourseProgress: avg(courseRows.map((c) => c.progress)),
      quizzesTaken: quizRows.filter((r) => r.attempts > 0).length,
      quizzesPassed: quizRows.filter((r) => r.passed).length,
      averageBestScore: avg(quizRows.filter((r) => r.bestScore !== null).map((r) => r.bestScore)),
      certificates: certificates.length,
    },
    courses: courseRows,
    quizzes: quizRows,
    marks,
    certificates: { issued, pending },
  };
}
