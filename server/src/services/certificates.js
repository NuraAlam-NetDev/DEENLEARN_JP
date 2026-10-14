import { randomInt } from 'node:crypto';
import Certificate from '../models/Certificate.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { getProgressSummary } from './courseAccess.js';
import { httpError } from '../utils/httpError.js';

// No 0/O/1/I/L, so a code read out loud or copied by hand is hard to get wrong
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// DL-XXXX-XXXX-XXXX (12 characters, about 60 bits)
export function generateCertificateCode() {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `DL-${group()}-${group()}-${group()}`;
}

// Quizzes a student must still pass: every published quiz marked "required" in this course
export async function getPendingRequiredQuizzes(studentId, courseId) {
  const required = await Quiz.find({ course: courseId, required: true, published: true })
    .select('lesson')
    .lean();
  if (!required.length) return [];

  const passedIds = await QuizAttempt.distinct('quiz', {
    student: studentId,
    quiz: { $in: required.map((q) => q._id) },
    passed: true,
  });
  const passed = new Set(passedIds.map(String));
  const pending = required.filter((q) => !passed.has(String(q._id)));
  if (!pending.length) return [];

  const lessons = await Lesson.find({ _id: { $in: pending.map((q) => q.lesson) } })
    .select('title order')
    .sort({ order: 1, _id: 1 })
    .lean();
  return lessons.map((l) => ({ lessonId: l._id, lessonTitle: l.title }));
}

// Can this (enrolled) student get a certificate for this course right now?
//   eligible = every lesson is completed AND every required quiz is passed
export async function getCertificateStatus(studentId, courseId) {
  const [summary, pendingQuizzes] = await Promise.all([
    getProgressSummary(studentId, courseId),
    getPendingRequiredQuizzes(studentId, courseId),
  ]);
  const allLessonsDone = summary.totalLessons > 0 && summary.progress === 100;
  return {
    eligible: allLessonsDone && pendingQuizzes.length === 0,
    allLessonsDone,
    pendingQuizzes,
    ...summary,
  };
}

// Creates the certificate (or returns the existing one: issuing twice is harmless).
// `course` must have its teacher populated with { name }.
export async function issueCertificate({ student, course, recipientName }) {
  const existing = await Certificate.findOne({ student: student._id, course: course._id });
  if (existing) return { certificate: existing, created: false };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const certificate = await Certificate.create({
        student: student._id,
        course: course._id,
        code: generateCertificateCode(),
        recipientName,
        courseTitle: course.title,
        teacherName: course.teacher?.name ?? '',
        issuedAt: new Date(),
      });
      return { certificate, created: true };
    } catch (err) {
      if (err.code !== 11000) throw err;
      // Duplicate key: either a parallel request just issued this same certificate (return it),
      // or the random code collided (try another code).
      const raced = await Certificate.findOne({ student: student._id, course: course._id });
      if (raced) return { certificate: raced, created: false };
    }
  }
  throw httpError(500, 'Could not generate a certificate code. Please try again.');
}
