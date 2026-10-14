import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { Spinner } from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { StatCard } from '../../components/ui/Card.jsx';

export default function AdminHome() {
  const { t } = useTranslation();
  const { data, loading, error } = useFetch('/admin/stats');

  return (
    <div>
      <h1 className="mb-5 text-3xl font-bold text-brand-800">{t('admin.home.title')}</h1>

      {loading && <Spinner />}
      {error && <Alert>{error}</Alert>}

      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t('admin.home.users')}
            value={data.users.total}
            hint={t('admin.home.newWeek', { n: data.users.newLast7Days })}
          />
          <StatCard label={t('admin.home.students')} value={data.users.students} />
          <StatCard label={t('admin.home.teachers')} value={data.users.teachers} />
          <StatCard
            label={t('admin.home.pendingTeachers')}
            value={data.users.pendingTeachers}
            tone={data.users.pendingTeachers > 0 ? 'warning' : 'default'}
          />
          <StatCard label={t('admin.home.banned')} value={data.users.banned} />
          <StatCard
            label={t('admin.home.courses')}
            value={data.courses.total}
            hint={t('admin.home.coursesHint', { n: data.courses.published })}
          />
          <StatCard label={t('admin.home.lessons')} value={data.lessons.total} />
          <StatCard
            label={t('admin.home.enrollments')}
            value={data.enrollments.total}
            hint={t('admin.home.enrollHint', { n: data.enrollments.completed })}
          />
        </div>
      )}
    </div>
  );
}
