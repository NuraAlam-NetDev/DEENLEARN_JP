import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '../Alert.jsx';
import Discussion from '../Discussion.jsx';
import Badge from '../ui/Badge.jsx';
import { Card } from '../ui/Card.jsx';
import Icon from '../ui/Icon.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import NotesPanel from './NotesPanel.jsx';
import QuizPanel from './QuizPanel.jsx';

// Quiz / My notes / Q&A under a lesson. Controlled: the lesson page owns `active`
// (null = everything folded away), so it can also open a tab for the student.
// A tab's content is created the first time it is opened and then kept, so an unsaved note
// is not lost when the student peeks at another tab.
// quiz = the useFetch() result for GET /lessons/:id/quiz
export default function StudyTabs({ lessonId, quiz, active, onChange, onQuizAttempted }) {
  const { t } = useTranslation();
  const info = quiz.data;
  const hasQuiz = !!info?.quiz;
  const quizPending = hasQuiz && info.quiz.required && !info.summary.passed;

  const tabs = [
    ...(hasQuiz ? [{ id: 'quiz', label: t('reader.study.quiz'), icon: 'clipboard' }] : []),
    { id: 'notes', label: t('reader.study.notes'), icon: 'edit' },
    { id: 'discussion', label: t('reader.study.qa'), icon: 'message' },
  ];
  const current = tabs.some((tab) => tab.id === active) ? active : null;

  const [visited, setVisited] = useState(() => new Set(current ? [current] : []));
  if (current && !visited.has(current)) setVisited(new Set(visited).add(current)); // "adjust state while rendering"

  function onKeyDown(e) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = tabs.findIndex((tab) => tab.id === document.activeElement?.dataset.tab);
    const next = tabs[(i + step + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(`study-tab-${next.id}`)?.focus();
  }

  return (
    <Card className="mt-6 overflow-hidden" aria-label={t('reader.study.label')}>
      <div
        role="tablist"
        aria-label={t('reader.study.label')}
        onKeyDown={onKeyDown}
        className="flex overflow-x-auto border-b border-brand-100 bg-brand-50/40"
      >
        {tabs.map((tab) => {
          const selected = current === tab.id;
          return (
            <button
              key={tab.id}
              id={`study-tab-${tab.id}`}
              data-tab={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`study-panel-${tab.id}`}
              tabIndex={selected || (!current && tab.id === tabs[0].id) ? 0 : -1}
              onClick={() => onChange(selected ? null : tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                selected
                  ? 'border-brand-700 bg-white text-brand-800'
                  : 'border-transparent text-slate-600 hover:bg-brand-50 hover:text-brand-800'
              }`}
            >
              <Icon name={tab.icon} className="h-4 w-4" />
              {tab.label}
              {tab.id === 'quiz' && quizPending && <Badge tone="gold">{t('reader.study.required')}</Badge>}
            </button>
          );
        })}
      </div>

      {!current && (
        <p className="px-5 py-4 text-sm text-slate-500">
          {hasQuiz ? t('reader.study.hintWithQuiz') : t('reader.study.hintNoQuiz')}
        </p>
      )}

      {tabs.map((tab) =>
        visited.has(tab.id) ? (
          <div
            key={tab.id}
            id={`study-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`study-tab-${tab.id}`}
            hidden={current !== tab.id}
            className="p-4 sm:p-5"
          >
            {tab.id === 'quiz' &&
              (quiz.loading && !info ? (
                <Skeleton className="h-32 w-full" />
              ) : info?.quiz ? (
                <QuizPanel lessonId={lessonId} info={info} onAttempted={onQuizAttempted} />
              ) : (
                <Alert>{quiz.error || t('reader.study.quizUnavailable')}</Alert>
              ))}
            {tab.id === 'notes' && <NotesPanel lessonId={lessonId} />}
            {tab.id === 'discussion' && <Discussion lessonId={lessonId} />}
          </div>
        ) : null
      )}
    </Card>
  );
}