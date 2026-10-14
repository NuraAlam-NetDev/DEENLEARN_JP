import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Card } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import QueryState from '../../components/ui/QueryState.jsx';
import Alert from '../../components/Alert.jsx';
import { Spinner } from '../../components/Spinner.jsx';

// Admins moderate courses (show, hide, delete). Creating courses is the teacher's job.
export default function AdminCourses() {
  const { t } = useTranslation();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const { data, loading, error, reload } = useFetch(`/admin/courses?page=${page}&limit=20`);

  async function run(id, request, message) {
    setBusyId(id);
    try {
      await request();
      toast.success(message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function handleToggle(c) {
    const next = !c.published;
    const question = next
      ? t('adminCourses.confirmShow', { title: c.title })
      : t('adminCourses.confirmHide', { title: c.title });
    if (!window.confirm(question)) return;
    run(
      c._id,
      () => api.patch(`/admin/courses/${c._id}/visibility`, { published: next }),
      next ? t('adminCourses.shown') : t('adminCourses.hiddenToast')
    );
  }

  function handleDelete(c) {
    if (!window.confirm(t('adminCourses.confirmDelete', { title: c.title }))) return;
    run(c._id, () => api.delete(`/admin/courses/${c._id}`), t('adminCourses.deleted'));
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-brand-800">{t('adminCourses.title')}</h1>
      <p className="mb-5 text-sm text-slate-500">{t('adminCourses.subtitle')}</p>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.courses.length === 0}
        emptyTitle={t('adminCourses.empty')}
        emptyText={t('adminCourses.emptyText')}
      >
              {data && data.courses.length > 0 && (
        <div className="space-y-3">
          {data.courses.map((c) => {
            const busy = busyId === c._id;
            return (
              <Card key={c._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800" dir="auto">
                    {c.title}
                  </p>
                  <p className="truncate text-sm text-slate-500" dir="auto">
                    {t('adminCourses.teacherLabel', { name: c.teacher?.name ?? t('adminCourses.unknownTeacher') })}
                  </p>
                  <div className="mt-2">
                    {c.published ? (
                      <Badge tone="green">{t('adminCourses.published')}</Badge>
                    ) : (
                      <Badge tone="gray">{t('adminCourses.hidden')}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" loading={busy} onClick={() => handleToggle(c)}>
                    {c.published ? t('adminCourses.hide') : t('adminCourses.show')}
                  </Button>
                  <Button size="sm" variant="danger" disabled={busy} onClick={() => handleDelete(c)}>
                    {t('adminCourses.delete')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </QueryState>

      {data && <Pagination page={page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}
