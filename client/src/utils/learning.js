// Where the "Continue" button of an enrollment (from GET /enrollments/mine) should go.
// Returns null when the course has no lessons yet.
export function learnTarget(enrollment) {
  const courseId = enrollment.course._id;
  if (!enrollment.totalLessons) return null;

  if (enrollment.nextLesson) {
    return {
      to: `/student/courses/${courseId}/lessons/${enrollment.nextLesson._id}`,
      label: enrollment.completedLessons > 0 ? 'Continue learning' : 'Start learning',
    };
  }
  // every lesson done: /student/courses/:id opens the first lesson
  return { to: `/student/courses/${courseId}`, label: 'Review course' };
}

// Same rule as the server (utils/progress.js): never show 100% until every lesson is done
export function calcPercent(done, total) {
  if (!total) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.round((done / total) * 100));
}
