import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import Bookmark from '../models/Bookmark.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Note from '../models/Note.js';
import Question from '../models/Question.js';
import Reply from '../models/Reply.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta } from '../utils/pagination.js';
import { syncCourseProgress } from '../services/courseAccess.js';
import { uploadFile, deleteAssets } from '../services/media.js';
import { parseLessonLanguage } from '../utils/languages.js';
import { slugify } from '../utils/slug.js';
import { notifyEnrolled } from '../utils/notify.js';

const MAX_ATTACHMENTS = 20;

// GET /api/teacher/courses/:courseId/lessons?page=&limit=   (no content; use GET /lessons/:id)
export const listCourseLessons = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const filter = { course: req.course._id };

  const [lessons, total] = await Promise.all([
    Lesson.find(filter)
      .select('-content')
      .sort({ order: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Lesson.countDocuments(filter),
  ]);

  res.json({ lessons, ...pageMeta(page, limit, total) });
});

// GET /api/teacher/lessons/:id  (full lesson, for the edit form)
export const getLesson = asyncHandler(async (req, res) => {
  res.json({ lesson: req.lesson });
});

// POST /api/teacher/courses/:courseId/lessons
export const createLesson = asyncHandler(async (req, res) => {
  const course = req.course;

  const data = { ...req.body };
  if (data.order === undefined) {
    const last = await Lesson.findOne({ course: course._id }).sort({ order: -1 }).select('order');
    data.order = last ? last.order + 1 : 1;
  }

  const lesson = await Lesson.create({ ...data, course: course._id });
  await syncCourseProgress(course._id); // total lessons changed
  await notifyEnrolled(course._id, {
    type: 'lesson',
    title: `New lesson: ${lesson.title}`,
    body: `A new lesson was added to ${course.title}.`,
    link: `/student/courses/${course._id}/lessons/${lesson._id}`,
  });
  res.status(201).json({ lesson });
});

// PATCH /api/teacher/lessons/:id
export const updateLesson = asyncHandler(async (req, res) => {
  Object.assign(req.lesson, req.body);
  await req.lesson.save();
  res.json({ lesson: req.lesson });
});

// DELETE /api/teacher/lessons/:id
export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = req.lesson;
  const assets = lesson.attachments.map((a) => a.toObject());

  await Promise.all([
    lesson.deleteOne(),
    Progress.deleteMany({ lesson: lesson._id }),
    Bookmark.deleteMany({ lesson: lesson._id }),
    Quiz.deleteMany({ lesson: lesson._id }),
    QuizAttempt.deleteMany({ lesson: lesson._id }),
    Note.deleteMany({ lesson: lesson._id }),
    Question.deleteMany({ lesson: lesson._id }),
    Reply.deleteMany({ lesson: lesson._id }),
  ]);
  await syncCourseProgress(req.course._id);
  await deleteAssets(assets);

  res.json({ message: 'Lesson deleted' });
});

// PUT /api/teacher/courses/:courseId/lessons/reorder   body: { lessonIds: [...] }
export const reorderLessons = asyncHandler(async (req, res) => {
  const course = req.course;

  const existing = await Lesson.find({ course: course._id }).select('_id').lean();
  const existingIds = new Set(existing.map((l) => String(l._id)));
  const ids = req.body.lessonIds.map(String);

  const valid =
    ids.length === existingIds.size &&
    new Set(ids).size === ids.length &&
    ids.every((id) => existingIds.has(id));
  if (!valid) {
    throw httpError(400, 'lessonIds must list every lesson of this course exactly once');
  }

  await Lesson.bulkWrite(
    ids.map((id, i) => ({
      updateOne: { filter: { _id: id, course: course._id }, update: { $set: { order: i + 1 } } },
    }))
  );
  res.json({ message: 'Lessons reordered' });
});

// POST /api/teacher/lessons/:id/attachments   (multipart, field "file": image / PDF / audio)
export const addAttachment = asyncHandler(async (req, res) => {
  const lesson = req.lesson;
  if (lesson.attachments.length >= MAX_ATTACHMENTS) {
    throw httpError(400, `A lesson can have at most ${MAX_ATTACHMENTS} attachments`);
  }

  const course = await Course.findById(lesson.course).select('title').lean();
  const courseFolder = `${slugify(course?.title)}-${lesson.course}`;
  const lessonFolder = `${slugify(lesson.title)}-${lesson._id}`;

  // The file goes into a folder per language: .../lessons/<lesson>/<language>/
  const language = parseLessonLanguage(req.body?.language);
  const file = await uploadFile(req.file, {
    folder: `deenlearn/courses/${courseFolder}/lessons/${lessonFolder}/${language}`,
  });

  try {
    lesson.attachments.push({ ...file, language });
    await lesson.save();
  } catch (err) {
    await deleteAssets([file]); // don't leave an orphan in Cloudinary
    throw err;
  }

  const attachment = lesson.attachments[lesson.attachments.length - 1];
  res.status(201).json({ attachment, lesson });
});

// DELETE /api/teacher/lessons/:id/attachments/:attachmentId
export const removeAttachment = asyncHandler(async (req, res) => {
  const lesson = req.lesson;
  const attachment = lesson.attachments.id(req.params.attachmentId);
  if (!attachment) throw httpError(404, 'Attachment not found');

  const asset = attachment.toObject();
  lesson.attachments.pull({ _id: attachment._id });
  await lesson.save();
  await deleteAssets([asset]);

  res.json({ lesson });
});