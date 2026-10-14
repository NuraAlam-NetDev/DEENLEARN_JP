const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Lessons written before the rich-text editor existed are plain text (blank line = new paragraph).
// Turns them into HTML; real HTML is returned unchanged, so this is safe to call twice.
export function toHtml(value = '') {
  if (!value) return '';
  if (/^\s*</.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
