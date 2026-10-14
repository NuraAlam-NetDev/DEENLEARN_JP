const ARABIC = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LATIN = /[A-Za-z]/g;

// True when a paragraph is mostly Arabic-script, so it can use the Arabic font
export function isMostlyArabic(text = '') {
  const arabic = (text.match(ARABIC) || []).length;
  const latin = (text.match(LATIN) || []).length;
  return arabic > latin;
}
