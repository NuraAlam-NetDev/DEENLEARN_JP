import { sanitizeRichText } from '../utils/sanitizeRichText.js';

// Passwords and tokens are never touched: "<" or ">" can be a legitimate part of a password.
const RAW_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'confirmPassword', 'refreshToken']);

// Lesson bodies (teacher side) hold rich-text HTML: sanitized, not stripped
const RICH_PATH = /^\/api\/teacher\/(courses\/[^/]+\/lessons|lessons\/[^/]+)/;

// Never accepted from a client: MongoDB operators ($where, $ne) and dotted paths ("role.admin")
const unsafeKey = (key) => key.startsWith('$') || key.includes('.');

// NUL bytes and control characters (tab, newline and carriage return are kept)
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// HTML tags. React escapes text when it shows it; this makes sure tags are never stored as plain text.
const TAG = /<\/?[a-z!][^>]*>/gi;

export function cleanText(value) {
  return value.replace(CONTROL, '').replace(TAG, '');
}

function cleanValue(value, key, rich) {
  if (typeof value === 'string') {
    if (RAW_KEYS.has(key)) return value.replace(CONTROL, '');
    if (rich && key === 'content') return sanitizeRichText(value.replace(CONTROL, ''));
    return cleanText(value);
  }
  if (Array.isArray(value)) return value.map((item) => cleanValue(item, key, rich));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (unsafeKey(k)) continue; // dropped entirely, so it never reaches Mongoose
      out[k] = cleanValue(v, k, rich);
    }
    return out;
  }
  return value; // numbers, booleans and null pass through unchanged
}

// Runs on every request, after the body parsers. Cleans req.body and req.query.
export function sanitizeInput(req, _res, next) {
  const rich = RICH_PATH.test(req.path || '');
  if (req.body && typeof req.body === 'object') req.body = cleanValue(req.body, '', rich);
  if (req.query && typeof req.query === 'object') req.query = cleanValue(req.query, '', false);
  next();
}
