import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import StudentReport from '../../components/report/StudentReport.jsx';

// /student/report : the student's own learning record
export default function MyReport() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/enrollments/report');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('report.title')}</h1>
        <p className="mt-1 text-slate-600">{t('report.subtitle')}</p>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
      >
        {data && <StudentReport data={data} />}
      </QueryState>
    </div>
  );
}
