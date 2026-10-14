import sanitizeHtml from 'sanitize-html';

// Lesson content is HTML written in the rich-text editor. Anything a student's browser will
// render must pass through here first, because a teacher's request body can contain anything
// (the editor is only a convenience, not a security boundary).
const OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3',
    'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre', 'hr',
  ],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'], // no javascript: / data: links
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer nofollow' }),
  },
};

export function sanitizeRichText(html = '') {
  return sanitizeHtml(html, OPTIONS);
}
