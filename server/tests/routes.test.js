// Wiring test: boots the real Express app with a stubbed user lookup (no database needed) and checks
// everything that is decided BEFORE a database query: login, role guards, input validation, body limits.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Lesson } = await import('../src/models/Lesson.js');
const { signAccessToken, ACCESS_COOKIE } = await import('../src/utils/tokens.js');

const IDS = { student: 'a'.repeat(24), teacher: 'b'.repeat(24), pending: 'c'.repeat(24) };
const USERS = {
  [IDS.student]: { _id: IDS.student, role: 'student', status: 'active', approvalStatus: 'approved' },
  [IDS.teacher]: { _id: IDS.teacher, role: 'teacher', status: 'active', approvalStatus: 'approved' },
  [IDS.pending]: { _id: IDS.pending, role: 'teacher', status: 'active', approvalStatus: 'pending' },
};
const originalFindById = User.findById;
const originalLessonFindById = Lesson.findById;
User.findById = async (id) => USERS[id] ?? null;
Lesson.findById = async () => null; // "lesson not found": lets requests get past the body parser without a database

let server;
let base;
before(async () => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  User.findById = originalFindById;
  Lesson.findById = originalLessonFindById;
  server.close();
});

const OID = 'd'.repeat(24);
async function call(method, path, { as, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (as) headers.Cookie = `${ACCESS_COOKIE}=${signAccessToken(IDS[as])}`;
  const res = await fetch(base + path, { method, headers, body: body === undefined || method === 'GET' ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json };
}

const goodQuiz = { questions: [{ text: 'q', options: [{ text: 'a', isCorrect: true }, { text: 'b' }] }] };

test('every new endpoint demands a login (and only the public one does not)', async () => {
  const guarded = [
    ['GET', `/api/lessons/${OID}/quiz`],
    ['POST', `/api/lessons/${OID}/quiz/attempts`],
    ['GET', `/api/lessons/${OID}/note`],
    ['PUT', `/api/lessons/${OID}/note`],
    ['DELETE', `/api/lessons/${OID}/note`],
    ['GET', `/api/lessons/${OID}/questions`],
    ['POST', `/api/lessons/${OID}/questions`],
    ['GET', '/api/notes'],
    ['GET', `/api/questions/${OID}`],
    ['DELETE', `/api/questions/${OID}`],
    ['POST', `/api/questions/${OID}/replies`],
    ['DELETE', `/api/replies/${OID}`],
    ['PATCH', `/api/replies/${OID}/accept`],
    ['GET', '/api/certificates/mine'],
    ['GET', `/api/certificates/${OID}/pdf`],
    ['POST', `/api/courses/${OID}/certificate`],
    ['GET', `/api/teacher/lessons/${OID}/quiz`],
    ['PUT', `/api/teacher/lessons/${OID}/quiz`],
    ['DELETE', `/api/teacher/lessons/${OID}/quiz`],
    ['GET', `/api/teacher/lessons/${OID}/quiz/results`],
    ['GET', `/api/teacher/courses/${OID}/questions`],
  ];
  for (const [method, path] of guarded) {
    const r = await call(method, path);
    assert.equal(r.status, 401, `${method} ${path} should need a login, got ${r.status}`);
  }
  // public: bad code is a clean 404 from the controller, not a 401 or a crash
  const verify = await call('GET', '/api/certificates/verify/not-a-code');
  assert.equal(verify.status, 404);
  assert.match(verify.json.message, /No certificate/);
});

test('roles: teachers cannot take quizzes / claim certificates, students cannot edit quizzes', async () => {
  for (const [method, path] of [
    ['GET', `/api/lessons/${OID}/quiz`],
    ['POST', `/api/lessons/${OID}/quiz/attempts`],
    ['PUT', `/api/lessons/${OID}/note`],
    ['GET', '/api/notes'],
    ['GET', '/api/certificates/mine'],
    ['POST', `/api/courses/${OID}/certificate`],
  ]) {
    assert.equal((await call(method, path, { as: 'teacher', body: {} })).status, 403, `${method} ${path}`);
  }
  for (const [method, path] of [
    ['GET', `/api/teacher/lessons/${OID}/quiz`],
    ['PUT', `/api/teacher/lessons/${OID}/quiz`],
    ['GET', `/api/teacher/courses/${OID}/questions`],
  ]) {
    assert.equal((await call(method, path, { as: 'student', body: goodQuiz })).status, 403, `${method} ${path}`);
  }
  // a teacher whose account is still pending cannot use the teacher routes
  const pending = await call('GET', `/api/teacher/lessons/${OID}/quiz`, { as: 'pending' });
  assert.equal(pending.status, 403);
  assert.match(pending.json.message, /approval/);
});

test('input is validated before anything touches the database', async () => {
  const bad = [
    ['POST', `/api/lessons/${OID}/quiz/attempts`, 'student', { answers: [{ question: 'x', selected: [] }] }],
    ['PUT', `/api/lessons/${OID}/note`, 'student', { content: 'x'.repeat(8001) }],
    ['POST', `/api/lessons/${OID}/questions`, 'student', { title: 'ab' }],
    ['POST', `/api/questions/${OID}/replies`, 'student', { body: '   ' }],
    ['PATCH', `/api/replies/${OID}/accept`, 'student', { accepted: 'yes' }],
    ['POST', `/api/courses/${OID}/certificate`, 'student', { recipientName: 'محمد' }],
    ['POST', `/api/courses/${OID}/certificate`, 'student', {}],
  ];
  for (const [method, path, as, body] of bad) {
    const r = await call(method, path, { as, body });
    assert.equal(r.status, 400, `${method} ${path} ${JSON.stringify(body).slice(0, 40)} -> ${r.status}`);
    assert.equal(r.json.message, 'Validation failed');
  }
  const q = await call('GET', `/api/lessons/${OID}/questions?limit=999`, { as: 'student' });
  assert.equal(q.status, 400);
  const n = await call('GET', '/api/notes?course=nope', { as: 'student' });
  assert.equal(n.status, 400);
});

test('body limit: a big quiz is accepted on the quiz route only', async () => {
  const big = {
    questions: Array.from({ length: 40 }, (_, i) => ({
      text: `Question ${i} ` + '\u0995'.repeat(300), // Bengali: 3 bytes per character
      explanation: '\u0995'.repeat(300),
      options: Array.from({ length: 6 }, (_, o) => ({ text: '\u0995'.repeat(100), isCorrect: o === 0 })),
    })),
  };
  assert.ok(Buffer.byteLength(JSON.stringify(big)) > 32 * 1024, 'test body must exceed the 32kb default');

  // quiz route: gets past the body parser, then fails at the (stubbed) lesson lookup
  const quiz = await call('PUT', `/api/teacher/lessons/${OID}/quiz`, { as: 'teacher', body: big });
  assert.equal(quiz.status, 404);
  assert.equal(quiz.json.message, 'Lesson not found');

  // an unrelated route keeps the small default limit
  const other = await call('POST', '/api/teacher/courses', { as: 'teacher', body: big });
  assert.equal(other.status, 413);
});

test('unknown routes still 404 and /api/lessons/:id keeps working next to the new sub-routes', async () => {
  assert.equal((await call('GET', '/api/nothing-here')).status, 404);
  assert.equal((await call('GET', `/api/lessons/${OID}`)).status, 401); // existing route, still guarded
});
