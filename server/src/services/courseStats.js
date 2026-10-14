import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';

// Adds lessonCount and studentCount to plain (lean/object) course objects
export async function attachCounts(courses) {
  if (!courses.length) return courses;
  const ids = courses.map((c) => c._id);
  const countBy = (Model) =>
    Model.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]);

  const [lessonRows, studentRows] = await Promise.all([countBy(Lesson), countBy(Enrollment)]);
  const lessons = new Map(lessonRows.map((r) => [String(r._id), r.n]));
  const students = new Map(studentRows.map((r) => [String(r._id), r.n]));

  for (const c of courses) {
    c.lessonCount = lessons.get(String(c._id)) ?? 0;
    c.studentCount = students.get(String(c._id)) ?? 0;
  }
  return courses;
}
