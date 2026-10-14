import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../services/api.js';
import { deleteCourse, setCoursePublished } from '../../services/teacherService.js';
import Alert from '../../components/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button, { ButtonLink } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

const PAGE_SIZE = 8;
const TABS = [
  ['', 'tabAll'],
  ['published', 'tabPublished'],
  ['draft', 'tabDrafts'],
];

const chip = (active) =>
  `shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'border-brand-700 bg-brand-700 text-white'
      : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-50'
  }`;

function CourseRow({ course, busy, onTogglePublish, onDelete }) {
  const { t } = useTranslation();

  return (
    <Card as="li" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="pattern-star flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-700 text-gold-400">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Icon name="book" className="h-7 w-7" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 break-words font-display text-xl font-bold text-brand-800" dir="auto">
            <Link to={`/teacher/courses/${course._id}`} className="hover:text-brand-600">
              {course.title}
            </Link>
          </h2>
          <Badge tone={course.published ? 'green' : 'gray'}>
            {course.published ? t('teacher.courses.published') : t('teacher.courses.draft')}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          <span className="capitalize">{course.category}</span> ·{' '}
          {t('teacher.courses.lessonsCount', { count: course.lessonCount })} ·{' '}
          {t('teacher.courses.studentsCount', { count: course.studentCount })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink to={`/teacher/courses/${course._id}`} variant="outline" size="sm">
          {t('teacher.courses.manage')}
        </ButtonLink>
        <Button variant="ghost" size="sm" loading={busy} onClick={() => onTogglePublish(course)}>
          {course.published ? t('teacher.courses.unpublish') : t('teacher.courses.publish')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => onDelete(course)}
          aria-label={t('teacher.courses.deleteAria', { title: course.title })}
        >
          <Icon name="trash" className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </Card>
  );
}

export default function MyCourses() {
  const { t } = useTranslation();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const q = useDebounce(search.trim(), 350);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status) query.set('status', status);
  if (q) query.set('q', q);
  const { data, loading, error, reload } = useFetch(`/teacher/courses?${query}`);

  async function togglePublish(course) {
    setBusyId(course._id);
    try {
      await setCoursePublished(course._id, !course.published);
      toast.success(course.published ? t('teacher.courses.toastUnpublished') : t('teacher.courses.toastPublished'));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err)); // e.g. "Add at least one lesson before publishing"
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    const course = toDelete;
    try {
      await deleteCourse(course._id);
      toast.success(t('teacher.courses.toastDeleted'));
      if (data.courses.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  }

  const filtering = !!(status || q);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-brand-800">{t('teacher.courses.title')}</h1>
        <ButtonLink to="/teacher/courses/new">
          <Icon name="plus" className="h-4 w-4" />
          {t('teacher.courses.newCourse')}
        </ButtonLink>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label={t('teacher.courses.filterLabel')}>
          {TABS.map(([value, key]) => (
            <button
              key={value}
              type="button"
              className={chip(status === value)}
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {t(`teacher.courses.${key}`)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t('teacher.courses.searchLabel')}
          aria-label={t('teacher.courses.searchLabel')}
          dir="auto"
          className="h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 sm:w-64"
        />
      </div>

      {loading && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.courses.length === 0}
        emptyTitle={filtering ? t('teacher.courses.noMatchTitle') : t('teacher.courses.noneTitle')}
        emptyText={filtering ? t('teacher.courses.noMatchText') : t('teacher.courses.noneText')}
        emptyAction={
          !filtering && (
            <ButtonLink to="/teacher/courses/new">
              <Icon name="plus" className="h-4 w-4" />
              {t('teacher.courses.newCourse')}
            </ButtonLink>
          )
        }
      >
              {data && data.courses.length > 0 && (
        <>
          <ul className="space-y-3">
            {data.courses.map((course) => (
              <CourseRow
                key={course._id}
                course={course}
                busy={busyId === course._id}
                onTogglePublish={togglePublish}
                onDelete={setToDelete}
              />
            ))}
          </ul>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
      </QueryState>

      <ConfirmDialog
        open={!!toDelete}
        title={t('teacher.courses.deleteTitle')}
        message={t('teacher.courses.deleteText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('teacher.courses.deleteConfirm')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}