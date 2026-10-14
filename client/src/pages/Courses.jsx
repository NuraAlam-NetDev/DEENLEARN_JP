import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import Alert from '../components/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { CourseCardSkeleton } from '../components/ui/Skeleton.jsx';
import CatalogCourseCard from '../components/CatalogCourseCard.jsx';

const PAGE_SIZE = 9;

const chip = (active) =>
  `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
    active
      ? 'border-brand-700 bg-brand-700 text-white'
      : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-50'
  }`;

// Search, category and page live in the URL (/courses?q=wudu&category=fiqh&page=2),
// so results can be shared, bookmarked and work with the back button.
export default function Courses() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);

  const [search, setSearch] = useState(q);
  const debounced = useDebounce(search.trim(), 350);

  function update(changes, { replace = false } = {}) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace }
    );
  }

  // typing -> (after a short pause) -> URL
  useEffect(() => {
    if (debounced !== q) update({ q: debounced, page: '' }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // URL changed from outside (back button, a link) -> update the box
  useEffect(() => {
    if (q !== debounced) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (q) query.set('q', q);
  if (category) query.set('category', category);

  const { data, loading, error } = useFetch(`/courses?${query}`);
  const { data: catData } = useFetch('/courses/categories');
  const categories = catData?.categories ?? [];

  // e.g. an old link to page 9 when there are only 2 pages
  useEffect(() => {
    if (data && data.pages > 0 && page > data.pages) update({ page: '' }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page]);

  const filtered = !!(q || category);
  function clearFilters() {
    setSearch('');
    setParams({}, { replace: true });
  }

  function goToPage(next) {
    update({ page: next > 1 ? String(next) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-800">{t('courses.title')}</h1>
      <p className="mt-1 text-slate-600">{t('courses.subtitle')}</p>

      {/* Search */}
      <div className="relative mt-5">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-slate-400">
          <Icon name="search" />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('courses.searchPlaceholder')}
          aria-label={t('courses.searchLabel')}
          dir="auto"
          className="h-12 w-full rounded-xl border border-brand-200 bg-white ps-11 pe-10 text-base outline-none placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label={t('courses.clearSearch')}
            className="absolute inset-y-0 end-2 my-auto h-8 rounded-md px-1.5 text-slate-400 hover:text-brand-700"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div
          className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          role="group"
          aria-label={t('courses.filterLabel')}
        >
          <button
            type="button"
            className={chip(!category)}
            aria-pressed={!category}
            onClick={() => update({ category: '', page: '' })}
          >
            {t('courses.all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              type="button"
              className={chip(category === c.category)}
              aria-pressed={category === c.category}
              onClick={() => update({ category: c.category, page: '' })}
            >
              {c.category} <span className="opacity-70">({c.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Result summary */}
      <div className="mt-5 flex min-h-8 items-center justify-between gap-3" aria-live="polite">
        <p className="text-sm text-slate-600">{data && t('courses.found', { n: data.total })}</p>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t('courses.clearFilters')}
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && !data && Array.from({ length: 6 }, (_, i) => <CourseCardSkeleton key={i} />)}
        {data?.courses.map((c) => (
          <CatalogCourseCard key={c._id} course={c} />
        ))}
      </div>

      {data && data.courses.length === 0 && (
        <EmptyState
          title={filtered ? t('courses.noMatchTitle') : t('courses.noneTitle')}
          text={filtered ? t('courses.noMatchText') : t('courses.noneText')}
          action={
            filtered ? (
              <Button variant="outline" onClick={clearFilters}>
                {t('courses.clearFilters')}
              </Button>
            ) : null
          }
        />
      )}

      {data && <Pagination page={page} pages={data.pages} onChange={goToPage} />}
    </div>
  );
}