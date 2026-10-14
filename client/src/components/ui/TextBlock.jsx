import { isMostlyArabic } from '../../utils/text.js';

// Renders user-written text (lesson content, descriptions) safely in any script.
// Each paragraph picks its OWN direction (dir="auto"), so Arabic paragraphs read
// right-to-left and English or Bengali ones left-to-right, even in the same lesson.
// Blank line = new paragraph. Rendered as plain text (never as HTML).
export default function TextBlock({ text = '', className = '' }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          dir="auto"
          className={`whitespace-pre-line break-words text-start ${
            isMostlyArabic(p) ? 'arabic text-2xl' : 'leading-relaxed'
          }`}
        >
          {p}
        </p>
      ))}
    </div>
  );
}
