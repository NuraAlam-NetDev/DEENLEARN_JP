import Lesson from '../models/Lesson.js';
import Question from '../models/Question.js';
import Reply from '../models/Reply.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pageMeta } from '../utils/pagination.js';
import { canManage, findCourseOr404, hasCourseAccess } from '../services/courseAccess.js';

const AUTHOR = { path: 'author', select: 'name role' };
const MAX_REPLIES = 200;

// The lesson plus its course, after checking that the user may take part:
// an enrolled student, the course's teacher, or an admin.
async function loadLessonForDiscussion(user, lessonId) {
  const lesson = await Lesson.findById(lessonId).select('title course').lean();
  if (!lesson) throw httpError(404, 'Lesson not found');
  const course = await findCourseOr404(lesson.course);
  if (!(await hasCourseAccess(user, course))) {
    throw httpError(403, 'Enroll in this course to join the discussion');
  }
  return { lesson, course };
}

// Same check, starting from a question id
async function loadQuestionForDiscussion(user, questionId) {
  const question = await Question.findById(questionId);
  if (!question) throw httpError(404, 'Question not found');
  const course = await findCourseOr404(question.course);
  if (!(await hasCourseAccess(user, course))) {
    throw httpError(403, 'Enroll in this course to join the discussion');
  }
  return { question, course };
}

const isAuthor = (user, doc) => String(doc.author?._id ?? doc.author) === String(user._id);

// GET /api/lessons/:id/questions?page=&limit=&status=all|unanswered
export const listQuestions = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const { course } = await loadLessonForDiscussion(req.user, req.params.id);

  const filter = { lesson: req.params.id };
  if (status === 'unanswered') filter.answered = false;

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .sort({ lastActivityAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(AUTHOR)
      .lean(),
    Question.countDocuments(filter),
  ]);

  res.json({ questions, canModerate: canManage(req.user, course), ...pageMeta(page, limit, total) });
});

// POST /api/lessons/:id/questions   body: { title, body }
export const createQuestion = asyncHandler(async (req, res) => {
  const { lesson, course } = await loadLessonForDiscussion(req.user, req.params.id);

  const question = await Question.create({
    lesson: lesson._id,
    course: course._id,
    author: req.user._id,
    title: req.body.title,
    body: req.body.body,
  });
  await question.populate(AUTHOR);
  res.status(201).json({ question });
});

// GET /api/questions/:id   -> the question with its replies (oldest first; the accepted answer is flagged)
export const getQuestion = asyncHandler(async (req, res) => {
  const { question, course } = await loadQuestionForDiscussion(req.user, req.params.id);
  await question.populate(AUTHOR);
  const replies = await Reply.find({ question: question._id })
    .sort({ createdAt: 1, _id: 1 })
    .limit(MAX_REPLIES)
    .populate(AUTHOR)
    .lean();

  res.json({ question, replies, canModerate: canManage(req.user, course) });
});

// DELETE /api/questions/:id   (the asker, the course's teacher, or an admin) -> also deletes its replies
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw httpError(404, 'Question not found');

  if (!isAuthor(req.user, question)) {
    const course = await findCourseOr404(question.course);
    if (!canManage(req.user, course)) throw httpError(403, 'You can only delete your own questions');
  }

  await Promise.all([Reply.deleteMany({ question: question._id }), question.deleteOne()]);
  res.json({ message: 'Question deleted' });
});

// POST /api/questions/:id/replies   body: { body }
export const createReply = asyncHandler(async (req, res) => {
  const { question } = await loadQuestionForDiscussion(req.user, req.params.id);

  const reply = await Reply.create({
    question: question._id,
    lesson: question.lesson,
    course: question.course,
    author: req.user._id,
    body: req.body.body,
  });
  await Question.updateOne(
    { _id: question._id },
    { $inc: { replyCount: 1 }, $set: { lastActivityAt: new Date() } }
  );
  await reply.populate(AUTHOR);
  res.status(201).json({ reply });
});

// DELETE /api/replies/:id   (the author, the course's teacher, or an admin)
export const deleteReply = asyncHandler(async (req, res) => {
  const reply = await Reply.findById(req.params.id);
  if (!reply) throw httpError(404, 'Reply not found');

  if (!isAuthor(req.user, reply)) {
    const course = await findCourseOr404(reply.course);
    if (!canManage(req.user, course)) throw httpError(403, 'You can only delete your own replies');
  }

  await reply.deleteOne();
  const update = { $inc: { replyCount: -1 } };
  if (reply.accepted) update.$set = { answered: false };
  await Question.updateOne({ _id: reply.question }, update);
  res.json({ message: 'Reply deleted' });
});

// PATCH /api/replies/:id/accept   body: { accepted }
// Marks a reply as THE answer (only one per question) or clears it.
// Allowed for the person who asked and for the course's teacher / an admin.
export const setReplyAccepted = asyncHandler(async (req, res) => {
  const reply = await Reply.findById(req.params.id);
  if (!reply) throw httpError(404, 'Reply not found');
  const question = await Question.findById(reply.question);
  if (!question) throw httpError(404, 'Question not found');

  const course = await findCourseOr404(question.course);
  if (!isAuthor(req.user, question) && !canManage(req.user, course)) {
    throw httpError(403, 'Only the person who asked, or the teacher, can pick the answer');
  }
  if (!(await hasCourseAccess(req.user, course))) {
    throw httpError(403, 'Enroll in this course to join the discussion');
  }

  const { accepted } = req.body;
  if (accepted) await Reply.updateMany({ question: question._id, accepted: true }, { $set: { accepted: false } });
  reply.accepted = accepted;
  await reply.save();
  question.answered = accepted;
  await question.save();

  await reply.populate(AUTHOR);
  res.json({ reply });
});

// GET /api/teacher/courses/:id/questions?page=&limit=&status=unanswered|all   (teacher's inbox)
export const listCourseQuestions = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const filter = { course: req.course._id };
  if (status === 'unanswered') filter.answered = false;

  const [rows, total] = await Promise.all([
    Question.find(filter)
      .sort({ lastActivityAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(AUTHOR)
      .populate('lesson', 'title')
      .lean(),
    Question.countDocuments(filter),
  ]);

  // a lesson deleted a moment ago can leave a dangling row; hide it
  res.json({ questions: rows.filter((q) => q.lesson), ...pageMeta(page, limit, total) });
});
