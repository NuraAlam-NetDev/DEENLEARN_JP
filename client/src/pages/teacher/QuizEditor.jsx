import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { deleteQuiz, saveQuiz } from '../../services/teacherService.js';
import { formatDate } from '../../utils/format.js';
import Alert from '../../components/Alert.jsx';
import FormField from '../../components/FormField.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import TextAreaField from '../../components/ui/TextAreaField.jsx';

// Same rules as the server (server/src/validators/quiz.js). Returns a list of messages.
function validateQuiz(q) {
  const problems = [];
  if (!q.title.trim()) problems.push('Give the quiz a title.');
  const pass = Number(q.passingScore);
  if (!Number.isInteger(pass) || pass < 0 || pass > 100) problems.push('Pass mark must be a whole number from 0 to 100.');
  if (q.published && q.questions.length === 0) problems.push('Add at least one question before publishing.');
  q.questions.forEach((question, i) => {
    const n = i + 1;
    if (!question.text.trim()) problems.push(`Question ${n}: write the question.`);
    if (question.options.length < 2) problems.push(`Question ${n}: add at least 2 options.`);
    if (question.options.some((o) => !o.text.trim())) problems.push(`Question ${n}: fill in or remove empty options.`);
    if (!question.options.some((o) => o.isCorrect)) problems.push(`Question ${n}: mark at least one option as correct.`);
  });
  return problems;
}

const blankQuestion = () => ({ key: crypto.randomUUID(), text: '', explanation: '', options: [blankOption(), blankOption()] });
function blankOption(isCorrect = false) {
  return { key: crypto.randomUUID(), text: '', isCorrect };
}

// server quiz -> editable state (keeps _id so edits do not break students' past attempts)
function toState(quiz) {
  if (!quiz) return { title: 'Quiz', passingScore: 70, published: false, required: false, questions: [] };
  return {
    title: quiz.title,
    passingScore: quiz.passingScore,
    published: quiz.published,
    required: quiz.required,
    questions: quiz.questions.map((q) => ({
      key: q._id, _id: q._id, text: q.text, explanation: q.explanation ?? '',
      options: q.options.map((o) => ({ key: o._id, _id: o._id, text: o.text, isCorrect: o.isCorrect })),
    })),
  };
}

function toBody(state) {
  return {
    title: state.title.trim(),
    passingScore: Number(state.passingScore),
    published: state.published,
    required: state.required,
    questions: state.questions.map((q) => ({
      ...(q._id && { _id: q._id }),
      text: q.text.trim(),
      explanation: q.explanation.trim(),
      options: q.options.map((o) => ({ ...(o._id && { _id: o._id }), text: o.text.trim(), isCorrect: o.isCorrect })),
    })),
  };
}

function QuestionCard({ index, total, question, onChange, onRemove, onMove }) {
  const set = (patch) => onChange({ ...question, ...patch });
  const setOption = (key, patch) => set({ options: question.options.map((o) => (o.key === key ? { ...o, ...patch } : o)) });
  const correct = question.options.filter((o) => o.isCorrect).length;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-brand-800">Question {index + 1}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move question ${index + 1} up`}>
            <Icon name="arrow-up" className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled={index === total - 1} onClick={() => onMove(1)} aria-label={`Move question ${index + 1} down`}>
            <Icon name="arrow-down" className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} aria-label={`Delete question ${index + 1}`}>
            <Icon name="trash" className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>

      <TextAreaField label="Question" rows={2} value={question.text} maxLength={1000} onChange={(e) => set({ text: e.target.value })} />

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-slate-700">
          Options <span className="font-normal text-slate-500">(tick every correct one{correct > 1 ? ' · students will see "select all that apply"' : ''})</span>
        </legend>
        <ul className="space-y-2">
          {question.options.map((o, oi) => (
            <li key={o.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={o.isCorrect}
                onChange={(e) => setOption(o.key, { isCorrect: e.target.checked })}
                aria-label={`Option ${oi + 1} is correct`}
                className="h-5 w-5 shrink-0 accent-brand-700"
              />
              <input
                type="text"
                value={o.text}
                maxLength={300}
                dir="auto"
                placeholder={`Option ${oi + 1}`}
                aria-label={`Option ${oi + 1} text`}
                onChange={(e) => setOption(o.key, { text: e.target.value })}
                className="h-10 min-w-0 flex-1 rounded-lg border border-brand-200 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 sm:text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={question.options.length <= 2}
                onClick={() => set({ options: question.options.filter((x) => x.key !== o.key) })}
                aria-label={`Remove option ${oi + 1}`}
              >
                <Icon name="x" className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        {question.options.length < 6 && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => set({ options: [...question.options, blankOption()] })}>
            <Icon name="plus" className="h-4 w-4" />
            Add option
          </Button>
        )}
      </fieldset>

      <TextAreaField
        label="Explanation (optional)"
        hint="Shown to the student after they submit."
        rows={2}
        value={question.explanation}
        maxLength={1000}
        onChange={(e) => set({ explanation: e.target.value })}
      />
    </Card>
  );
}

function Editor({ lessonId, courseId, lesson, quiz, reloadQuiz }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState(() => toState(quiz));
  const [problems, setProblems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const results = useFetch(quiz ? `/teacher/lessons/${lessonId}/quiz/results?limit=50` : null);

  const patch = (p) => setState((s) => ({ ...s, ...p }));
  const updateQuestion = (key, next) => setState((s) => ({ ...s, questions: s.questions.map((q) => (q.key === key ? next : q)) }));
  const moveQuestion = (i, dir) =>
    setState((s) => {
      const list = [...s.questions];
      [list[i], list[i + dir]] = [list[i + dir], list[i]];
      return { ...s, questions: list };
    });

  async function save(published = state.published) {
    const next = { ...state, published };
    const found = validateQuiz(next);
    setProblems(found);
    if (found.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const res = await saveQuiz(lessonId, toBody(next));
      setState(toState(res.quiz)); // pick up the ids the server gave to new questions / options
      reloadQuiz();
      toast.success(published ? 'Quiz saved and visible to students.' : 'Quiz saved as a draft.');
    } catch (err) {
      const fields = getFieldErrors(err);
      setProblems(Object.keys(fields).length ? Object.values(fields) : [getErrorMessage(err)]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await deleteQuiz(lessonId);
      toast.success('Quiz deleted');
      navigate(`/teacher/courses/${courseId}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-600" dir="auto">Lesson: <span className="font-semibold">{lesson.title}</span></p>

      {problems.length > 0 && (
        <Alert>
          <ul className="list-disc ps-5">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </Alert>
      )}

      <Card className="space-y-4 p-5">
        <FormField label="Quiz title" name="title" value={state.title} maxLength={150} onChange={(e) => patch({ title: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Pass mark (%)"
            name="passingScore"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={state.passingScore}
            onChange={(e) => patch({ passingScore: e.target.value })}
          />
        </div>
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={state.required} onChange={(e) => patch({ required: e.target.checked })} className="mt-1 h-5 w-5 accent-brand-700" />
          <span className="text-sm">
            <span className="font-medium text-slate-800">Students must pass this quiz</span>
            <span className="block text-slate-500">They cannot mark the lesson complete, or get the course certificate, until they pass.</span>
          </span>
        </label>
      </Card>

      {state.questions.map((q, i) => (
        <QuestionCard
          key={q.key}
          index={i}
          total={state.questions.length}
          question={q}
          onChange={(next) => updateQuestion(q.key, next)}
          onRemove={() => setState((s) => ({ ...s, questions: s.questions.filter((x) => x.key !== q.key) }))}
          onMove={(dir) => moveQuestion(i, dir)}
        />
      ))}

      {state.questions.length < 40 && (
        <Button variant="outline" onClick={() => setState((s) => ({ ...s, questions: [...s.questions, blankQuestion()] }))}>
          <Icon name="plus" className="h-4 w-4" />
          Add question
        </Button>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-brand-100 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <Badge tone={state.published ? 'green' : 'gray'}>{state.published ? 'Visible to students' : 'Draft'}</Badge>
        <div className="flex flex-wrap gap-2 sm:ms-auto">
          {quiz && (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)} disabled={saving}>
              <Icon name="trash" className="h-4 w-4 text-red-600" />
              Delete
            </Button>
          )}
          {state.published ? (
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>Unpublish</Button>
          ) : (
            <Button variant="outline" onClick={() => save(false)} loading={saving}>Save draft</Button>
          )}
          <Button onClick={() => save(true)} loading={saving}>{state.published ? 'Save changes' : 'Save & publish'}</Button>
        </div>
      </div>

      {quiz && (
        <Card className="p-5">
          <h2 className="font-display text-xl font-bold text-brand-800">Student results</h2>
          {results.loading && !results.data && <Spinner className="mt-3" />}
          {results.data && results.data.results.length === 0 && <p className="mt-2 text-sm text-slate-500">No student has taken this quiz yet.</p>}
          {results.data && results.data.results.length > 0 && (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {results.data.summary.students} student{results.data.summary.students === 1 ? '' : 's'} · {results.data.summary.passRate}% passed · average best score {results.data.summary.averageBestScore}%
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-start text-sm">
                  <thead>
                    <tr className="border-b border-brand-100 text-slate-500">
                      <th className="py-2 text-start font-medium">Student</th>
                      <th className="py-2 text-start font-medium">Best</th>
                      <th className="py-2 text-start font-medium">Attempts</th>
                      <th className="py-2 text-start font-medium">Status</th>
                      <th className="py-2 text-start font-medium">Last attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.data.results.map((r) => (
                      <tr key={r.student._id} className="border-b border-brand-50">
                        <td className="py-2" dir="auto">{r.student.name}</td>
                        <td className="py-2 font-semibold">{r.bestScore}%</td>
                        <td className="py-2">{r.attempts}</td>
                        <td className="py-2"><Badge tone={r.passed ? 'green' : 'gray'}>{r.passed ? 'Passed' : 'Not passed'}</Badge></td>
                        <td className="py-2 text-slate-500">{formatDate(r.lastAttemptAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this quiz?"
        message="The quiz and every student's attempts will be deleted. This cannot be undone."
        confirmLabel="Delete quiz"
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// /teacher/courses/:courseId/lessons/:lessonId/quiz
export default function QuizEditor() {
  const { courseId, lessonId } = useParams();
  const lesson = useFetch(`/teacher/lessons/${lessonId}`);
  const quiz = useFetch(`/teacher/lessons/${lessonId}/quiz`);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to={`/teacher/courses/${courseId}`} className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to course
      </Link>
      <h1 className="text-3xl font-bold text-brand-800">Lesson quiz</h1>

      {(lesson.loading || quiz.loading) && !(lesson.data && quiz.data) && <Spinner />}
      {(lesson.error || quiz.error) && <Alert>{lesson.error || quiz.error}</Alert>}
      {lesson.data && quiz.data && (
        <Editor key={quiz.data.quiz?._id ?? 'new'} lessonId={lessonId} courseId={courseId} lesson={lesson.data.lesson} quiz={quiz.data.quiz} reloadQuiz={quiz.reload} />
      )}
    </div>
  );
}
