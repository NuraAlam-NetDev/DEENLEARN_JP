// "Fiqh Basics 101" -> "fiqh-basics-101"; Bangla/Arabic letters are kept
export function slugify(text = '', max = 60) {
  const slug = String(text)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
  return slug || 'untitled';
}