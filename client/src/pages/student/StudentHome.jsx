import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { CourseCard } from '../../components/ui/Card.jsx';

export default function StudentHome() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/enrollments/mine?limit=6');

  return (
    <div>
      <h1 className="mb-5 text-3xl font-bold text-brand-800">{t('student.home.title')}</h1>

      {loading && <Spinner />}

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.enrollments.length === 0}
        emptyTitle={t('student.home.noCoursesTitle')}
        emptyText={t('student.home.noCoursesText')}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.enrollments.map((e) => (
            <CourseCard
              key={e._id}
              title={e.course.title}
              teacher={e.course.teacher?.name}
              category={e.course.category}
              lessonCount={e.totalLessons}
              progress={e.progress}
              thumbnail={e.course.thumbnail}
            />
          ))}
        </div>
      </QueryState>

    </div>
  );
}