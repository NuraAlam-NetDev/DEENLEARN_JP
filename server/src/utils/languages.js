import { httpError } from './httpError.js';

// Languages a lesson's PDF (and other files) can be saved in. Same set as the website languages.
export const LESSON_LANGUAGES = ['en', 'bn', 'ja', 'zh', 'ar', 'hi', 'ur'];

// Missing -> English. Anything else must be one of the list, so a teacher sees a mistake at once.
export function parseLessonLanguage(value) {
  if (value === undefined || value === null || value === '') return 'en';
  if (!LESSON_LANGUAGES.includes(String(value))) {
    throw httpError(400, `Language must be one of: ${LESSON_LANGUAGES.join(', ')}`);
  }
  return String(value);
}
