import { describe, test, expect } from '@jest/globals';
import { sanitizeInput, cleanText } from '../../src/middleware/sanitize.js';

const LESSON_PATH = '/api/teacher/lessons/' + 'a'.repeat(24);

// Runs the middleware the way Express would, and returns the cleaned request
function run(req) {
  let called = false;
  sanitizeInput(req, {}, () => {
    called = true;
  });
  expect(called).toBe(true);
  return req;
}

describe('cleanText (plain text fields)', () => {
  test('removes HTML tags but keeps the words inside', () => {
    expect(cleanText('Hello <script>alert(1)</script> world')).toBe('Hello alert(1) world');
  });

  test('keeps ordinary punctuation and ampersands', () => {
    expect(cleanText('Q&A: Fiqh & Aqeedah (2026)')).toBe('Q&A: Fiqh & Aqeedah (2026)');
  });

  test('removes NUL and control characters but keeps newlines and tabs', () => {
    expect(cleanText('a\u0000b\u0007c\nd\te')).toBe('abc\nd\te');
  });
});

describe('sanitizeInput (body and query)', () => {
  test('drops MongoDB operator keys at any depth', () => {
    const req = run({
      path: '/api/courses',
      query: {},
      body: { email: 'a@b.com', $where: 'sleep(1000)', nested: { $ne: null, ok: 'yes' } },
    });
    expect(req.body).toEqual({ email: 'a@b.com', nested: { ok: 'yes' } });
  });

  test('drops dotted keys, which are used for path injection (role.admin)', () => {
    const req = run({ path: '/api/users', query: {}, body: { 'profile.role': 'admin', name: 'Ali' } });
    expect(req.body).toEqual({ name: 'Ali' });
  });

  test('cleans strings inside arrays', () => {
    const req = run({
      path: '/api/teacher/x',
      query: {},
      body: { options: [{ text: '<img src=x onerror=alert(1)>Shahada' }] },
    });
    expect(req.body.options[0].text).toBe('Shahada');
  });

  test('keeps passwords exactly as typed, even with < or >', () => {
    const req = run({ path: '/api/auth/login', query: {}, body: { password: 'p<a>ss' } });
    expect(req.body.password).toBe('p<a>ss');
  });

  test('keeps numbers, booleans and null', () => {
    const req = run({ path: '/api/x', query: {}, body: { limit: 10, published: false, note: null } });
    expect(req.body).toEqual({ limit: 10, published: false, note: null });
  });

  test('lesson content is rich text: scripts and javascript: links are removed, safe tags kept', () => {
    const req = run({
      path: LESSON_PATH,
      query: {},
      body: { content: '<p>Hi</p><script>evil()</script><a href="javascript:x">bad</a>' },
    });
    expect(req.body.content).toContain('<p>Hi</p>');
    expect(req.body.content).not.toMatch(/script|javascript:/i);
  });

  test('outside lessons, the same content field is plain text', () => {
    const req = run({ path: '/api/notes', query: {}, body: { content: '<b>note</b>' } });
    expect(req.body.content).toBe('note');
  });

  test('the query string is cleaned as well', () => {
    const req = run({ path: '/api/courses', body: undefined, query: { q: '<b>fiqh</b>', $ne: 'y' } });
    expect(req.query).toEqual({ q: 'fiqh' });
  });
});
