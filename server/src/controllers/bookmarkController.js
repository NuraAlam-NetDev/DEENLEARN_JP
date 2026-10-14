import Bookmark from '../models/Bookmark.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta } from '../utils/pagination.js';
import { findEnrolledLesson } from '../services/courseAccess.js';

// POST /api/lessons/:id/bookmark   (idempotent: bookmarking twice is fine)
export const addBookmark = asyncHandler(async (req, res) => {
  const lesson = await findEnrolledLesson(req.user._id, req.params.id);

  await Bookmark.updateOne(
    { student: req.user._id, lesson: lesson._id },
    { $setOnInsert: { course: lesson.course } },
    { upsert: true }
  );
  res.json({ bookmarked: true });
});

// DELETE /api/lessons/:id/bookmark   (idempotent; works even if the lesson was deleted meanwhile)
export const removeBookmark = asyncHandler(async (req, res) => {
  await Bookmark.deleteOne({ student: req.user._id, lesson: req.params.id });
  res.json({ bookmarked: false });
});

// GET /api/bookmarks?page=&limit=&course=   newest first
export const myBookmarks = asyncHandler(async (req, res) => {
  const { page, limit, course } = req.query;
  const filter = { student: req.user._id };
  if (course) filter.course = course;

  const [rows, total] = await Promise.all([
    Bookmark.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('lesson', 'title order')
      .populate('course', 'title')
      .lean(),
    Bookmark.countDocuments(filter),
  ]);

  // a lesson or course deleted a moment ago can leave a dangling row; hide it
  const bookmarks = rows
    .filter((b) => b.lesson && b.course)
    .map((b) => ({ _id: b._id, createdAt: b.createdAt, lesson: b.lesson, course: b.course }));

  res.json({ bookmarks, ...pageMeta(page, limit, total) });
});
