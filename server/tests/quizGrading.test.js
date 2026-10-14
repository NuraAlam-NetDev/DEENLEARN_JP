import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReview, gradeAttempt, isMultiple, serializeQuizForStudent } from '../src/services/quizGrading.js';

// ids are plain strings here; in the app they are ObjectIds (the code compares them as strings)
const opt = (_id, isCorrect = false) => ({ _id, text: `option ${_id}`, isCorrect });
const quiz = {
  _id: 'quiz1',
  lesson: 'lesson1',
  title: 'Quiz',
  passingScore: 70,
  required: false,
  questions: [
    { _id: 'q1', text: 'Single', explanation: 'because', options: [opt('a'), opt('b', true), opt('c')] },
    { _id: 'q2', text: 'Multi', explanation: '', options: [opt('d', true), opt('e', true), opt('f')] },
    { _id: 'q3', text: 'Single 2', explanation: '', options: [opt('g', true), opt('h')] },
  ],
};
const ans = (question, ...selected) => ({ question, selected });

test('students never receive which options are correct', () => {
  const view = serializeQuizForStudent(quiz);
  assert.equal(JSON.stringify(view).includes('isCorrect'), false);
  assert.equal(JSON.stringify(view).includes('explanation'), false);
  assert.equal(view.questions[0].multiple, false);
  assert.equal(view.questions[1].multiple, true);
  assert.equal(isMultiple(quiz.questions[1]), true);
});

test('all correct -> 100% and passed', () => {
  const r = gradeAttempt(quiz, [ans('q1', 'b'), ans('q2', 'd', 'e'), ans('q3', 'g')]);
  assert.equal(r.correctCount, 3);
  assert.equal(r.score, 100);
  assert.equal(r.passed, true);
});

test('multiple-answer questions are all-or-nothing', () => {
  const partial = gradeAttempt(quiz, [ans('q1', 'b'), ans('q2', 'd'), ans('q3', 'g')]);
  assert.equal(partial.answers[1].correct, false);
  const extra = gradeAttempt(quiz, [ans('q1', 'b'), ans('q2', 'd', 'e', 'f'), ans('q3', 'g')]);
  assert.equal(extra.answers[1].correct, false);
  const order = gradeAttempt(quiz, [ans('q1', 'b'), ans('q2', 'e', 'd'), ans('q3', 'g')]);
  assert.equal(order.answers[1].correct, true);
});

test('selecting two options on a single-answer question is wrong, even if one is right', () => {
  const r = gradeAttempt(quiz, [ans('q1', 'a', 'b')]);
  assert.equal(r.answers[0].correct, false);
});

test('unanswered questions are wrong; unknown ids are ignored', () => {
  const r = gradeAttempt(quiz, [ans('nope', 'b'), ans('q1', 'zzz')]);
  assert.equal(r.correctCount, 0);
  assert.equal(r.score, 0);
  assert.equal(r.passed, false);
  assert.deepEqual(r.answers[0].selected, []); // the unknown option id was dropped
  assert.equal(r.answers.length, 3);
});

test('the first answer sent for a question wins (duplicates cannot be used to retry)', () => {
  const r = gradeAttempt(quiz, [ans('q1', 'a'), ans('q1', 'b')]);
  assert.equal(r.answers[0].correct, false);
});

test('passing mark uses exact arithmetic', () => {
  // 2 of 3 = 66.7% -> displayed 67, but the pass mark of 67 is not reached
  const two = [ans('q1', 'b'), ans('q2', 'd', 'e')];
  assert.equal(gradeAttempt({ ...quiz, passingScore: 66 }, two).passed, true);
  assert.equal(gradeAttempt({ ...quiz, passingScore: 67 }, two).passed, false);
  assert.equal(gradeAttempt(quiz, two).score, 67);
});

test('a score below 100 is never rounded up to 100', () => {
  const many = {
    ...quiz,
    passingScore: 100,
    questions: Array.from({ length: 200 }, (_, i) => ({ _id: `x${i}`, text: 't', options: [opt('y', true), opt('n')] })),
  };
  const answers = many.questions.map((q, i) => ans(q._id, i === 0 ? 'n' : 'y')); // 199 / 200
  const r = gradeAttempt(many, answers);
  assert.equal(r.score, 99);
  assert.equal(r.passed, false);
});

test('a quiz without questions cannot be passed', () => {
  const r = gradeAttempt({ ...quiz, questions: [], passingScore: 0 }, []);
  assert.equal(r.passed, false);
  assert.equal(r.score, 0);
});

test('review reveals the key and explanation only after grading', () => {
  const r = gradeAttempt(quiz, [ans('q1', 'a')]);
  const review = buildReview(quiz, r.answers);
  assert.deepEqual(review[0].correctOptionIds, ['b']);
  assert.deepEqual(review[0].selected, ['a']);
  assert.equal(review[0].correct, false);
  assert.equal(review[0].explanation, 'because');
  assert.deepEqual(review[1].correctOptionIds, ['d', 'e']);
});
