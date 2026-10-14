import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import Alert from '../Alert.jsx';
import { Spinner } from '../Spinner.jsx';
import Icon from '../ui/Icon.jsx';
import StudentReport from './StudentReport.jsx';

// One student's full report, for a teacher (their courses only) or an admin (everything)
export default function StudentDetailPage({ base, backTo }) {
  const { t } = useTranslation();
  const { studentId } = useParams();
  const { data, loading, error, reload } = useFetch(`${base}/students/${studentId}/report`);

  return (
    <div className="space-y-5">
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
        <Icon name="chevron-left" className="h-4 w-4" />
        {t('progress.back')}
      </Link>

      {loading && !data && <Spinner />}
      {error && (
        <Alert>
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            {t('report.retry')}
          </button>
        </Alert>
      )}
      {data && <StudentReport data={data} />}
    </div>
  );
}
