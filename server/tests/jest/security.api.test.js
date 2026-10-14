import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

// These requests are all decided BEFORE the database is touched, so no MongoDB is needed.
describe('HTTP-level security', () => {
  test('a NoSQL operator in the login email is rejected by validation (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: 'anything' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });

  test('a protected route without a login cookie answers 401 at once', async () => {
    const res = await request(app).get('/api/teacher/courses');
    expect(res.status).toBe(401);
  });

  test('a nested query string does not crash the server', async () => {
    const res = await request(app).get('/api/teacher/courses?status[$ne]=x&q[$where]=1');
    expect(res.status).toBe(401); // still stopped by auth, not by a crash
  });

  test('malformed JSON gets a clear 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not valid JSON/);
  });

  test('an oversized body on a small route gets 413', async () => {
    const body = JSON.stringify({ email: 'a@b.com', password: 'x'.repeat(40 * 1024) });
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send(body);
    expect(res.status).toBe(413);
  });

  test('a request from a site that is not allowed is refused (403)', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
  });

  test('unknown routes get a JSON 404 with a request id', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Route not found/);
    expect(res.headers['x-request-id']).toBeTruthy();
  });
});
