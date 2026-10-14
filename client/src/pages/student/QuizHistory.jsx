import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

// Every quiz you have taken: score, pass or not, and when. Newest first.
export default function QuizHistory() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(`/quiz-attempts/mine?page=${page}&limit=20`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Quiz results</h1>
        <p className="mt-1 text-slate-600">All your quiz attempts. A lesson counts as passed once you pass its quiz.</p>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4"><p className="text-sm text-slate-500">Attempts</p><p className="font-display text-2xl font-bold text-brand-800">{data.summary.attempts}</p></Card>
          <Card className="p-4"><p className="text-sm text-slate-500">Lessons passed</p><p className="font-display text-2xl font-bold text-brand-800">{data.summary.lessonsPassed}</p></Card>
          <Card className="p-4"><p className="text-sm text-slate-500">Average score</p><p className="font-display text-2xl font-bold text-brand-800">{data.summary.averageScore}%</p></Card>
        </div>
      )}

      <QueryState loading={loading && !data} error={error} onRetry={reload} retryLabel={t('report.retry')}
        empty={!!data && data.attempts.length === 0} emptyTitle="No quiz taken yet" emptyText="Quizzes at the end of lessons show your results here.">
        <ul className="space-y-2">
          {data?.attempts.map((a) => (
            <li key={a._id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800" dir="auto">{a.lesson?.title || 'Lesson removed'}</p>
                  <p className="text-xs text-slate-500" dir="auto">{a.course?.title} · {formatDateTime(a.createdAt)}</p>
                </div>
                <div className="text-end">
                  <p className="font-display text-xl font-bold text-brand-800">{a.score}%</p>
                  <p className="text-xs text-slate-500">{a.correctCount} / {a.totalQuestions} correct</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${a.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {a.passed ? 'Passed' : 'Not passed'}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </QueryState>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-slate-600">{page} / {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
