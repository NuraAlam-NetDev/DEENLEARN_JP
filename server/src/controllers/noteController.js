import Note from '../models/Note.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta, escapeRegex } from '../utils/pagination.js';
import { findEnrolledLesson } from '../services/courseAccess.js';

// GET /api/lessons/:id/note   -> { note: { content, updatedAt } | null }
export const getNote = asyncHandler(async (req, res) => {
  const lesson = await findEnrolledLesson(req.user._id, req.params.id);
  const note = await Note.findOne({ student: req.user._id, lesson: lesson._id })
    .select('content updatedAt')
    .lean();
  res.json({ note: note ?? null });
});

// PUT /api/lessons/:id/note   body: { content }   (saving an empty note deletes it)
export const saveNote = asyncHandler(async (req, res) => {
  const lesson = await findEnrolledLesson(req.user._id, req.params.id);
  const filter = { student: req.user._id, lesson: lesson._id };
  const { content } = req.body;

  if (!content) {
    await Note.deleteOne(filter);
    return res.json({ note: null });
  }

  const note = await Note.findOneAndUpdate(
    filter,
    { $set: { content, course: lesson.course } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  )
    .select('content updatedAt')
    .lean();
  res.json({ note });
});

// DELETE /api/lessons/:id/note   (idempotent; works even if the lesson was deleted meanwhile)
export const deleteNote = asyncHandler(async (req, res) => {
  await Note.deleteOne({ student: req.user._id, lesson: req.params.id });
  res.json({ note: null });
});

// GET /api/notes?page=&limit=&course=&q=   most recently edited first
export const myNotes = asyncHandler(async (req, res) => {
  const { page, limit, course, q } = req.query;
  const filter = { student: req.user._id };
  if (course) filter.course = course;
  if (q) filter.content = { $regex: escapeRegex(q), $options: 'i' };

  const [rows, total] = await Promise.all([
    Note.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('lesson', 'title')
      .populate('course', 'title')
      .lean(),
    Note.countDocuments(filter),
  ]);

  // a lesson or course deleted a moment ago can leave a dangling row; hide it
  const notes = rows
    .filter((n) => n.lesson && n.course)
    .map((n) => ({ _id: n._id, content: n.content, updatedAt: n.updatedAt, lesson: n.lesson, course: n.course }));

  res.json({ notes, ...pageMeta(page, limit, total) });
});
