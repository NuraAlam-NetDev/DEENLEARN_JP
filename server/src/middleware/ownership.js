import Lesson from '../models/Lesson.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { findCourseOr404 } from '../services/courseAccess.js';

function assertOwner(course, user) {
  if (String(course.teacher) !== String(user._id)) {
    throw httpError(403, 'You can only manage your own courses and lessons');
  }
}

// Loads the course from req.params[param] and makes sure the logged-in teacher owns it.
// Sets req.course.
export const loadOwnedCourse = (param = 'id') =>
  asyncHandler(async (req, _res, next) => {
    const course = await findCourseOr404(req.params[param]);
    assertOwner(course, req.user);
    req.course = course;
    next();
  });

// Loads the lesson from req.params.id and checks ownership of its course.
// Sets req.lesson and req.course.
export const loadOwnedLesson = asyncHandler(async (req, _res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw httpError(404, 'Lesson not found');

  const course = await findCourseOr404(lesson.course);
  assertOwner(course, req.user);

  req.lesson = lesson;
  req.course = course;
  next();
});
