import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Alert from '../../components/Alert.jsx';
import { ButtonLink } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatDate } from '../../utils/format.js';

const PAGE_SIZE = 20;

// /student/notes  -> every note the student wrote, most recently edited first
export default function Notes() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const [search, setSearch] = useState(q);
  const debounced = useDebounce(search.trim(), 350);

  useEffect(() => {
    if (debounced !== q) setParams(debounced ? { q: debounced } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (q) query.set('q', q);
  const { data, loading, error, reload } = useFetch(`/notes?${query}`);

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-800">{t('student.notes.title')}</h1>
      <p className="mt-1 text-slate-600">{t('student.notes.subtitle')}</p>

      <div className="relative mt-5">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-slate-400">
          <Icon name="search" />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('student.notes.searchPlaceholder')}
          aria-label={t('student.notes.searchPlaceholder')}
          dir="auto"
          className="h-12 w-full rounded-xl border border-brand-200 bg-white ps-11 pe-4 text-base outline-none placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.notes.length === 0}
        emptyTitle={q ? t('student.notes.noMatchTitle') : t('student.notes.noneTitle')}
        emptyText={q ? t('student.notes.noMatchText') : t('student.notes.noneText')}
        emptyAction={!q && <ButtonLink to="/student/courses">{t('student.notes.goCourses')}</ButtonLink>}
      >
        {data && data.notes.length > 0 && (
          <>
            <p className="mt-5 text-sm text-slate-600" aria-live="polite">
              {t('student.notes.count', { count: data.total })}
            </p>
            <ul className="mt-2 space-y-3">
              {data.notes.map((n) => (
                <Card as="li" key={n._id} className="p-4">
                  <h2 className="break-words text-lg font-bold leading-snug text-brand-800" dir="auto">
                    <Link
                      to={`/student/courses/${n.course._id}/lessons/${n.lesson._id}?tab=notes`}
                      className="hover:text-brand-600"
                    >
                      {n.lesson.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-slate-500">
                    <span dir="auto">{n.course.title}</span> ·{' '}
                    {t('student.notes.editedOn', { date: formatDate(n.updatedAt) })}
                  </p>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm text-slate-700" dir="auto">
                    {n.content}
                  </p>
                </Card>
              ))}
            </ul>
            <Pagination
              page={page}
              pages={data.pages}
              onChange={(next) => {
                setParams((p) => {
                  const s = new URLSearchParams(p);
                  if (next > 1) s.set('page', String(next));
                  else s.delete('page');
                  return s;
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}