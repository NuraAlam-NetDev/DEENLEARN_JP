import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import { httpError } from '../utils/httpError.js';
import { calcPercent } from '../utils/progress.js';
import { planBlocksAccess } from './plans.js';

export async function findCourseOr404(id) {
  const course = await Course.findById(id);
  if (!course) throw httpError(404, 'Course not found');
  return course;
}

// A lesson the student may study: it must exist and the student must be enrolled in its course
export async function findEnrolledLesson(studentId, lessonId) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw httpError(404, 'Lesson not found');

  const enrolled = await Enrollment.exists({ student: studentId, course: lesson.course });
  if (!enrolled) throw httpError(403, 'Enroll in this course first');
  if (await planBlocksAccess(studentId, lesson.course)) {
    throw httpError(403, 'An installment is overdue. Pay it to continue.');
  }
  return lesson;
}

// Where to send a student who clicks "continue" on each of these courses.
// Map: courseId -> { firstLessonId, nextLessonId }
//   nextLessonId = first lesson (by order) not completed yet, null when everything is done.
// Courses without lessons are absent from the map.
export async function getResumeLessons(studentId, courseIds) {
  const result = new Map();
  if (!courseIds.length) return result;

  const [lessons, doneRows] = await Promise.all([
    Lesson.find({ course: { $in: courseIds } })
      .select('course')
      .sort({ order: 1, _id: 1 })
      .lean(),
    Progress.find({ student: studentId, course: { $in: courseIds }, completed: true })
      .select('lesson')
      .lean(),
  ]);
  const done = new Set(doneRows.map((p) => String(p.lesson)));

  for (const lesson of lessons) {
    const key = String(lesson.course);
    const entry = result.get(key) ?? { firstLessonId: lesson._id, nextLessonId: null };
    if (!entry.nextLessonId && !done.has(String(lesson._id))) entry.nextLessonId = lesson._id;
    result.set(key, entry);
  }
  return result;
}

// Course owner (teacher) or admin
export function canManage(user, course) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const teacherId = course.teacher?._id ?? course.teacher;
  return String(teacherId) === String(user._id);
}

// Manager OR enrolled student
export async function hasCourseAccess(user, course) {
  if (canManage(user, course)) return true;
  if (!(await Enrollment.exists({ student: user._id, course: course._id }))) return false;
  return !(await planBlocksAccess(user._id, course._id));
}

// Live numbers for one student in one course
export async function getProgressSummary(studentId, courseId) {
  const [totalLessons, completedLessons] = await Promise.all([
    Lesson.countDocuments({ course: courseId }),
    Progress.countDocuments({ student: studentId, course: courseId, completed: true }),
  ]);
  return {
    progress: calcPercent(completedLessons, totalLessons),
    completedLessons,
    totalLessons,
  };
}

// Recalculate one student's progress % and store it on the enrollment
export async function recomputeEnrollment(studentId, courseId) {
  const summary = await getProgressSummary(studentId, courseId);
  await Enrollment.updateOne(
    { student: studentId, course: courseId },
    { progress: summary.progress }
  );
  return summary;
}

// Recalculate every enrolled student's progress (after lessons added/removed)
export async function syncCourseProgress(courseId) {
  const enrollments = await Enrollment.find({ course: courseId }).select('student').lean();
  if (!enrollments.length) return;

  const total = await Lesson.countDocuments({ course: courseId });
  const doneRows = await Progress.aggregate([
    { $match: { course: courseId, completed: true } },
    { $group: { _id: '$student', n: { $sum: 1 } } },
  ]);
  const done = new Map(doneRows.map((r) => [String(r._id), r.n]));

  await Enrollment.bulkWrite(
    enrollments.map((e) => ({
      updateOne: {
        filter: { _id: e._id },
        update: { $set: { progress: calcPercent(done.get(String(e.student)) ?? 0, total) } },
      },
    }))
  );
}
