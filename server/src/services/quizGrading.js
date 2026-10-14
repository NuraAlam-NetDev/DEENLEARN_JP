// Pure functions (no database, no Express) so the grading rules are easy to test.
// A "quiz" here is a plain object: { questions: [{ _id, text, explanation, options: [{ _id, text, isCorrect }] }], passingScore }.

const ids = (list) => list.map(String);

// A question with more than one correct option is "select all that apply".
export const isMultiple = (question) => question.options.filter((o) => o.isCorrect).length > 1;

// What a student may see BEFORE submitting: never includes which options are correct.
export function serializeQuizForStudent(quiz) {
  return {
    _id: quiz._id,
    lesson: quiz.lesson,
    title: quiz.title,
    passingScore: quiz.passingScore,
    required: quiz.required,
    questions: quiz.questions.map((q) => ({
      _id: q._id,
      text: q.text,
      multiple: isMultiple(q),
      options: q.options.map((o) => ({ _id: o._id, text: o.text })),
    })),
  };
}

// Grades submitted answers: [{ question, selected: [optionId, ...] }].
// - One point per question, all-or-nothing: the selection must equal the set of correct options.
// - Unanswered questions count as wrong. Unknown question / option ids are ignored.
// - Passing uses exact arithmetic, and a score under 100 never rounds up to 100.
export function gradeAttempt(quiz, submitted = []) {
  const picked = new Map(); // questionId -> Set(optionId); the first answer for a question wins
  for (const a of submitted) {
    const key = String(a.question);
    if (!picked.has(key)) picked.set(key, new Set(ids(a.selected ?? [])));
  }

  const answers = quiz.questions.map((q) => {
    const valid = new Set(ids(q.options.map((o) => o._id)));
    const selected = [...(picked.get(String(q._id)) ?? [])].filter((id) => valid.has(id));
    const correctIds = ids(q.options.filter((o) => o.isCorrect).map((o) => o._id));
    const correct =
      correctIds.length > 0 &&
      selected.length === correctIds.length &&
      correctIds.every((id) => selected.includes(id));
    return { question: q._id, selected, correct };
  });

  const totalQuestions = quiz.questions.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const score =
    totalQuestions === 0
      ? 0
      : correctCount === totalQuestions
        ? 100
        : Math.min(99, Math.round((correctCount / totalQuestions) * 100));
  const passed = totalQuestions > 0 && correctCount * 100 >= quiz.passingScore * totalQuestions;

  return { answers, correctCount, totalQuestions, score, passed };
}

// The answer key shown to a student AFTER they submit.
export function buildReview(quiz, answers) {
  const byQuestion = new Map(answers.map((a) => [String(a.question), a]));
  return quiz.questions.map((q) => {
    const a = byQuestion.get(String(q._id));
    return {
      question: q._id,
      text: q.text,
      selected: ids(a?.selected ?? []),
      correct: !!a?.correct,
      correctOptionIds: ids(q.options.filter((o) => o.isCorrect).map((o) => o._id)),
      explanation: q.explanation || '',
    };
  });
}
