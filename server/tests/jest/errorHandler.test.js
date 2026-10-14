import { describe, test, expect, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { errorHandler, notFound, requestId } from '../../src/middleware/errorHandler.js';
import { httpError } from '../../src/utils/httpError.js';

// A tiny app that throws whatever the test asks for
function appThrowing(error) {
  const app = express();
  app.use(requestId);
  app.use(express.json({ limit: '1kb' }));
  app.post('/echo', (req, res) => res.json({ ok: true }));
  app.get('/boom', (_req, _res, next) => next(error));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

const originalEnv = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

describe('global error handler', () => {
  test('malformed JSON gets a clear 400, not a stack trace', async () => {
    const res = await request(appThrowing(null)).post('/echo').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Request body is not valid JSON');
  });

  test('a body over the limit gets 413', async () => {
    const res = await request(appThrowing(null))
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ text: 'x'.repeat(2048) }));
    expect(res.status).toBe(413);
  });

  test('an unknown route gets a JSON 404 that names the route', async () => {
    const res = await request(appThrowing(null)).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Route not found: GET \/nope/);
  });

  test('a deliberate 4xx error keeps its message', async () => {
    const res = await request(appThrowing(httpError(422, 'Title is already used'))).get('/boom');
    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Title is already used');
  });

  test('a 500 never leaks internal details in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(appThrowing(new Error('connect ECONNREFUSED db-password-hunter2'))).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Something went wrong. Please try again.');
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2|ECONNREFUSED|stack/);
  });

  test('a 500 shows the message and stack outside production (for developers)', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(appThrowing(new Error('something broke'))).get('/boom');
    expect(res.body.message).toBe('something broke');
    expect(res.body.stack).toBeTruthy();
  });

  test('every error response carries a request id', async () => {
    const res = await request(appThrowing(httpError(400, 'bad'))).get('/boom').set('X-Request-Id', 'abc-12345678');
    expect(res.body.requestId).toBe('abc-12345678');
    expect(res.headers['x-request-id']).toBe('abc-12345678');
  });

  test('a CORS refusal becomes 403', async () => {
    const res = await request(appThrowing(new Error('CORS blocked: https://evil.example'))).get('/boom');
    expect(res.status).toBe(403);
    expect(res.body.message).not.toMatch(/evil\.example/);
  });
});
