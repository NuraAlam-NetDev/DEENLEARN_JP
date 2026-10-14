// The certificate PDF uses the built-in PDF fonts, which only cover Latin text (WinAnsi).
// pdf-lib throws if asked to draw anything else, so text is cleaned first.
// Arabic and Bengali need an embedded font AND text shaping, which pdf-lib does not do.

const EXTRA = new Set([...'€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ']);
// Common transliteration marks (Ma'ruf, Qur'an, 'Ali) and dashes that WinAnsi lacks
const SIMPLE = { 'ʿ': "'", 'ʾ': "'", 'ʻ': "'", 'ʼ': "'", '‐': '-', '‑': '-', '‒': '-', '−': '-' };
const INVISIBLE = /^[\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]$/u;

function isSupported(ch) {
  const cp = ch.codePointAt(0);
  return (cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff) || EXTRA.has(ch);
}

// "Ḥ" -> "H", "ṣ" -> "s": drop the accent if the plain letter is printable
function foldAccents(ch) {
  const base = ch.normalize('NFD').replace(/\p{M}/gu, '');
  return base && [...base].every(isSupported) ? base : null;
}

// Returns { text, lost }: `text` is safe to draw, `lost` counts characters that had to be dropped.
export function toPdfText(input) {
  let text = '';
  let lost = 0;
  for (const raw of String(input ?? '').normalize('NFC')) {
    if (INVISIBLE.test(raw) || /^\p{M}$/u.test(raw)) continue;
    const ch = SIMPLE[raw] ?? raw;
    if (/\s/u.test(ch)) {
      text += ' ';
    } else if (isSupported(ch)) {
      text += ch;
    } else {
      const folded = foldAccents(ch);
      if (folded) text += folded;
      else lost += 1;
    }
  }
  return { text: text.replace(/ {2,}/g, ' ').trim(), lost };
}
