import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { ButtonLink } from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Card } from '../../components/ui/Card.jsx';

export default function TeacherHome() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const pending = user.approvalStatus === 'pending';
  const rejected = user.approvalStatus === 'rejected';

  // The teacher API answers 403 until an admin approves the account, so don't call it yet
  const { data, loading, error, reload } = useFetch(pending || rejected ? null : '/teacher/courses?limit=5');

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-brand-800">{t('teacher.home.title')}</h1>

      {pending && <Alert type="warning">{t('teacher.approval.pending')}</Alert>}
      {rejected && (
        <Alert type="error">
          {user.rejectionReason
            ? t('teacher.approval.rejectedReason', { reason: user.rejectionReason })
            : t('teacher.approval.rejected')}
        </Alert>
      )}

      {loading && <Spinner />}

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.courses.length === 0}
        emptyTitle={t('teacher.home.noCoursesTitle')}
        emptyText={t('teacher.home.noCoursesText')}
        emptyAction={<ButtonLink to="/teacher/courses/new">{t('teacher.home.newCourse')}</ButtonLink>}
      >
              {data && data.courses.length > 0 && (
        <>
          <p className="text-slate-600">
            {t('teacher.home.courseCount', { count: data.total })}
            {' · '}
            <Link to="/teacher/courses" className="text-brand-700 underline">
              {t('teacher.home.manageAll')}
            </Link>
          </p>
          <ul className="space-y-3">
            {data.courses.map((c) => (
              <Card as="li" key={c._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words text-xl font-bold text-brand-800" dir="auto">
                    <Link to={`/teacher/courses/${c._id}`} className="hover:text-brand-600">
                      {c.title}
                    </Link>
                  </h2>
                  <Badge tone={c.published ? 'green' : 'gray'}>
                    {c.published ? t('teacher.home.published') : t('teacher.home.draft')}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {t('teacher.home.lessonsStudents', { lessons: c.lessonCount, students: c.studentCount })}
                </p>
              </Card>
            ))}
          </ul>
        </>
      )}
      </QueryState>
    </div>
  );
}