import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import LiveClass from '../models/LiveClass.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { notify, notifyEnrolled } from '../utils/notify.js';
import { hasCourseAccess } from '../services/courseAccess.js';

const JOIN_OPENS_MIN = 10;     // the join link appears 10 minutes before the start
const REMIND_BEFORE_MIN = 30;  // the "starts soon" notice goes out 30 minutes before

// Status of a class at a given time
function statusOf(c, now) {
  const start = new Date(c.startsAt).getTime();
  const end = start + c.durationMin * 60000;
  if (now.getTime() < start) return 'upcoming';
  if (now.getTime() <= end) return 'live';
  return 'ended';
}

// POST /api/teacher/live-classes  (teacher, own course only)
export const createLiveClass = asyncHandler(async (req, res) => {
  const { courseId, title, startsAt, durationMin, joinUrl } = req.body;
  const course = await Course.findById(courseId).select('title teacher').lean();
  if (!course) throw httpError(404, 'Course not found');
  if (String(course.teacher) !== String(req.user._id)) throw httpError(403, 'This is not your course');

  const lesson = await LiveClass.create({ course: courseId, teacher: req.user._id, title, startsAt, durationMin, joinUrl });
  await notifyEnrolled(courseId, {
    type: 'live',
    title: `Live class: ${title}`,
    body: `${course.title}: ${new Date(startsAt).toLocaleString()}`,
    link: '/student/live',
  });
  res.status(201).json({ liveClass: lesson });
});

// GET /api/teacher/live-classes?courseId=  (teacher's own classes, newest first)
export const listTeacherLiveClasses = asyncHandler(async (req, res) => {
  const own = await Course.find({ teacher: req.user._id }).distinct('_id');
  const filter = { teacher: req.user._id };
  if (req.query.courseId) {
    if (!own.some((id) => String(id) === String(req.query.courseId))) throw httpError(403, 'This is not your course');
    filter.course = req.query.courseId;
  }
  const classes = await LiveClass.find(filter).sort({ startsAt: -1 }).limit(100).populate('course', 'title').lean();
  res.json({ classes: classes.map((c) => ({ ...c, status: statusOf(c, new Date()) })) });
});

// DELETE /api/teacher/live-classes/:id
export const deleteLiveClass = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid class');
  const removed = await LiveClass.deleteOne({ _id: req.params.id, teacher: req.user._id });
  if (!removed.deletedCount) throw httpError(404, 'Class not found');
  res.json({ ok: true });
});

// GET /api/live-classes/upcoming  (student): classes for courses they can study, with the join link near the start.
// Also sends the "starts soon" notice once, the first time anyone opens this list near the start time.
export const studentLiveClasses = asyncHandler(async (req, res) => {
  const now = new Date();
  const enrolled = await Enrollment.find({ student: req.user._id }).distinct('course');
  const courses = await Course.find({ _id: { $in: enrolled } });
  const allowed = [];
  for (const c of courses) if (await hasCourseAccess(req.user, c)) allowed.push(c._id);
  if (!allowed.length) return res.json({ classes: [] });

  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const rows = await LiveClass.find({ course: { $in: allowed }, startsAt: { $gte: from, $lte: to } })
    .sort({ startsAt: 1 })
    .populate('course', 'title')
    .lean();

  for (const c of rows) {
    const minsToStart = (new Date(c.startsAt).getTime() - now.getTime()) / 60000;
    if (!c.reminded && minsToStart > 0 && minsToStart <= REMIND_BEFORE_MIN) {
      const claimed = await LiveClass.updateOne({ _id: c._id, reminded: false }, { reminded: true });
      if (claimed.modifiedCount) {
        await notifyEnrolled(c.course._id, {
          type: 'live',
          title: `Starts soon: ${c.title}`,
          body: `${c.course.title} starts in about ${Math.max(1, Math.round(minsToStart))} minutes.`,
          link: '/student/live',
        });
      }
    }
  }

  const classes = rows.map((c) => {
    const status = statusOf(c, now);
    const minsToStart = (new Date(c.startsAt).getTime() - now.getTime()) / 60000;
    const joinable = status === 'live' || (status === 'upcoming' && minsToStart <= JOIN_OPENS_MIN);
    return {
      _id: c._id,
      title: c.title,
      course: { _id: c.course._id, title: c.course.title },
      startsAt: c.startsAt,
      durationMin: c.durationMin,
      status,
      joinUrl: joinable ? c.joinUrl : null,
      joinOpensAt: new Date(new Date(c.startsAt).getTime() - JOIN_OPENS_MIN * 60000),
    };
  });
  res.json({ classes });
});
