import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { formatDate } from '../../utils/format.js';
import Alert from '../Alert.jsx';
import { Spinner } from '../Spinner.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Pagination from '../ui/Pagination.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';

// Student list for teachers (base="/teacher") and admins (base="/admin").
// The server limits what each one sees: a teacher only gets students in their own courses.
export default function StudentProgressPage({ base, detailBase }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 350);
  const [courseId, setCourseId] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [q, courseId]);

  // teacher and admin course lists both accept limit up to 50
  const courses = useFetch(`${base}/courses?limit=50`);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (q) params.set('q', q);
  if (courseId) params.set('courseId', courseId);
  const { data, loading, error, reload } = useFetch(`${base}/students?${params}`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('progress.title')}</h1>
        <p className="mt-1 text-slate-600">{t('progress.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('progress.search')}
          aria-label={t('progress.search')}
          dir="auto"
          className="h-10 flex-1 rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          aria-label={t('progress.course')}
          className="h-10 rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none sm:w-64"
        >
          <option value="">{t('progress.allCourses')}</option>
          {(courses.data?.courses ?? []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.students.length === 0}
        emptyTitle={t('progress.empty.title')}
        emptyText={t('progress.empty.text')}
      >
        {data && data.students.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-brand-100 bg-white">
              <table className="w-full min-w-[46rem] text-start text-sm">
                <thead>
                  <tr className="border-b border-brand-100 text-slate-500">
                    <th className="px-4 py-3 text-start font-medium">{t('progress.cols.student')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('progress.cols.course')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('progress.cols.progress')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('progress.cols.quizzes')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('progress.cols.lastActive')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s) => (
                    <tr key={`${s.studentId}-${s.courseId}`} className="border-b border-brand-50 align-middle">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800" dir="auto">{s.name}</p>
                        <p className="text-xs text-slate-500" dir="auto">{s.email}</p>
                      </td>
                      <td className="px-4 py-3" dir="auto">{s.courseTitle}</td>
                      <td className="min-w-40 px-4 py-3">
                        <ProgressBar value={s.progress} />
                        <p className="mt-1 text-xs text-slate-500">
                          {t('progress.lessons', { done: s.completedLessons, total: s.totalLessons })}
                        </p>
                      </td>
                      <td className="px-4 py-3">{t('progress.passed', { n: s.quizzesPassed })}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(s.lastActivityAt)}</td>
                      <td className="px-4 py-3">
                        <Link to={`${detailBase}/${s.studentId}`} className="font-semibold text-brand-700 hover:underline">
                          {t('progress.viewReport')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  );
}
