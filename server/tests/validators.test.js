import test from 'node:test';
import assert from 'node:assert/strict';
import { saveQuizSchema, submitAttemptSchema } from '../src/validators/quiz.js';
import { claimCertificateSchema } from '../src/validators/certificate.js';
import { saveNoteSchema } from '../src/validators/note.js';
import { createQuestionSchema, createReplySchema } from '../src/validators/discussion.js';

const goodQuestion = {
  text: 'What is the first pillar?',
  options: [{ text: 'Shahada', isCorrect: true }, { text: 'Hajj' }],
};

test('a valid quiz passes and gets defaults', () => {
  const r = saveQuizSchema.parse({ questions: [goodQuestion] });
  assert.equal(r.title, 'Quiz');
  assert.equal(r.passingScore, 70);
  assert.equal(r.published, false);
  assert.equal(r.questions[0].options[1].isCorrect, false);
});

test('quiz rules: options, a correct answer, publishing, duplicate ids', () => {
  const bad = (body) => saveQuizSchema.safeParse(body).success === false;
  assert.ok(bad({ questions: [{ text: 'q', options: [{ text: 'only one', isCorrect: true }] }] }));
  assert.ok(bad({ questions: [{ text: 'q', options: [{ text: 'a' }, { text: 'b' }] }] })); // none correct
  assert.ok(bad({ questions: [{ text: '  ', options: goodQuestion.options }] }));
  assert.ok(bad({ published: true, questions: [] })); // nothing to publish
  assert.ok(!bad({ published: false, questions: [] })); // empty draft is fine
  assert.ok(bad({ passingScore: 101, questions: [goodQuestion] }));
  assert.ok(bad({ questions: Array.from({ length: 41 }, () => goodQuestion) }));
  const id = 'a'.repeat(24);
  assert.ok(bad({ questions: [{ ...goodQuestion, _id: id }, { ...goodQuestion, _id: id }] }));
  assert.ok(bad({ questions: [{ ...goodQuestion, _id: 'not-an-id' }] }));
});

test('attempt answers must use valid ids', () => {
  const id = 'b'.repeat(24);
  assert.ok(submitAttemptSchema.safeParse({ answers: [{ question: id, selected: [id] }] }).success);
  assert.ok(!submitAttemptSchema.safeParse({ answers: [{ question: 'x', selected: [] }] }).success);
  assert.ok(!submitAttemptSchema.safeParse({}).success);
});

test('certificate name: folds accents, rejects scripts the PDF cannot print', () => {
  assert.equal(claimCertificateSchema.parse({ recipientName: '  Muḥammad Alī ' }).recipientName, 'Muhammad Ali');
  assert.ok(!claimCertificateSchema.safeParse({ recipientName: 'محمد علي' }).success);
  assert.ok(!claimCertificateSchema.safeParse({ recipientName: 'A' }).success);
  assert.ok(!claimCertificateSchema.safeParse({ recipientName: 'x'.repeat(81) }).success);
  const err = claimCertificateSchema.safeParse({ recipientName: 'আব্দুল' });
  assert.match(err.error.issues[0].message, /English letters/);
});

test('notes may be empty (that deletes them) but not huge', () => {
  assert.equal(saveNoteSchema.parse({ content: '   ' }).content, '');
  assert.ok(!saveNoteSchema.safeParse({ content: 'x'.repeat(8001) }).success);
});

test('discussion input', () => {
  assert.ok(createQuestionSchema.safeParse({ title: 'Why?' }).success);
  assert.equal(createQuestionSchema.parse({ title: 'Why?' }).body, '');
  assert.ok(!createQuestionSchema.safeParse({ title: 'ab' }).success);
  assert.ok(!createReplySchema.safeParse({ body: '   ' }).success);
});
