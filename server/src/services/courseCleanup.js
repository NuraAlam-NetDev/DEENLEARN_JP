import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import Bookmark from '../models/Bookmark.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Note from '../models/Note.js';
import Question from '../models/Question.js';
import Reply from '../models/Reply.js';
import { deleteAssets } from './media.js';

// Permanently removes a course with its lessons, enrollments, progress, quizzes, notes, discussions
// and uploaded files. Issued certificates are kept on purpose: they hold their own copy of the
// course title, so a student's certificate stays valid after the course is gone.
// Used by both the teacher (own course) and admin (moderation) delete endpoints.
export async function deleteCourseCascade(course) {
  const lessons = await Lesson.find({ course: course._id }).select('attachments').lean();
  const assets = lessons.flatMap((l) => l.attachments);
  if (course.thumbnailPublicId) {
    assets.push({ publicId: course.thumbnailPublicId, resourceType: 'image' });
  }

  await Promise.all([
    Lesson.deleteMany({ course: course._id }),
    Enrollment.deleteMany({ course: course._id }),
    Progress.deleteMany({ course: course._id }),
    Bookmark.deleteMany({ course: course._id }),
    Quiz.deleteMany({ course: course._id }),
    QuizAttempt.deleteMany({ course: course._id }),
    Note.deleteMany({ course: course._id }),
    Question.deleteMany({ course: course._id }),
    Reply.deleteMany({ course: course._id }),
  ]);
  await course.deleteOne();
  await deleteAssets(assets); // best-effort, never throws
}
