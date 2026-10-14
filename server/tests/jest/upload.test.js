import { describe, test, expect } from '@jest/globals';
import { validateUpload } from '../../src/middleware/upload.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
const PDF = Buffer.from('%PDF-1.4\n% minimal test file, padded to be long enough');

// Runs the middleware with a fake multer file and returns the error it passed on (or undefined)
function check(allowed, file) {
  let error;
  validateUpload(allowed)({ file }, {}, (e) => {
    error = e;
  });
  return error;
}

const make = (buffer, extra = {}) => ({ buffer, size: buffer.length, mimetype: 'application/octet-stream', ...extra });

describe('validateUpload', () => {
  test('rejects a request with no file (400)', () => {
    expect(check(['image'], undefined).status).toBe(400);
  });

  test('rejects an empty file (400)', () => {
    expect(check(['image'], make(Buffer.alloc(0))).status).toBe(400);
  });

  test('rejects HTML that pretends to be an image (415)', () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    expect(check(['image'], make(html, { mimetype: 'image/png' })).status).toBe(415);
  });

  test('rejects SVG, which can carry scripts (415)', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
    expect(check(['image'], make(svg, { mimetype: 'image/svg+xml' })).status).toBe(415);
  });

  test('accepts a real PNG when images are allowed, and records what it is', () => {
    const file = make(PNG, { mimetype: 'image/png' });
    expect(check(['image'], file)).toBeUndefined();
    expect(file.detected).toEqual({ kind: 'image', mime: 'image/png', ext: 'png' });
  });

  test('rejects a PDF on a route that only accepts images (415)', () => {
    expect(check(['image'], make(PDF, { mimetype: 'application/pdf' })).status).toBe(415);
  });

  test('enforces the image size cap (413) even when the file is under MAX_FILE_MB', () => {
    const file = { buffer: PNG, size: 6 * 1024 * 1024, mimetype: 'image/png' };
    expect(check(['image'], file).status).toBe(413);
  });

  test('accepts a PDF under its cap', () => {
    expect(check(['pdf'], make(PDF, { mimetype: 'application/pdf' }))).toBeUndefined();
  });
});
