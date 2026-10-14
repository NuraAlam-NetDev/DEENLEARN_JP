// Same rule as the server (server/src/utils/progress.js): never show 100% until EVERY lesson is done
export function calcPercent(done, total) {
  if (!total) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.round((done / total) * 100));
}

// Where to open a course from a list row: the next unfinished lesson, else the first one (to review)
export function lessonLink(courseId, ...lessonIds) {
  const lessonId = lessonIds.find(Boolean);
  return lessonId ? `/student/courses/${courseId}/lessons/${lessonId}` : null;
}
