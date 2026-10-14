import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Card } from '../../components/ui/Card.jsx';

const PILL = { upcoming: 'bg-slate-100 text-slate-700', live: 'bg-green-100 text-green-800', ended: 'bg-slate-100 text-slate-500' };

// Live classes for the courses you can study. The join button appears 10 minutes before the start.
export default function LiveClasses() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/live-classes/upcoming');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Live classes</h1>
        <p className="mt-1 text-slate-600">Times are in your device's time zone. Keep the page open or check here before the start.</p>
      </div>
      <QueryState loading={loading && !data} error={error} onRetry={reload} retryLabel={t('report.retry')}
        empty={!!data && data.classes.length === 0} emptyTitle="No live classes scheduled" emptyText="When your teacher schedules one, it appears here.">
        <ul className="space-y-3">
          {data?.classes.map((c) => (
            <li key={c._id}>
              <Card className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800" dir="auto">{c.title}</p>
                    <p className="text-sm text-slate-600" dir="auto">{c.course.title}</p>
                    <p className="text-sm text-slate-600">{formatDateTime(c.startsAt)} · {c.durationMin} min</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[c.status]}`}>{c.status}</span>
                </div>
                {c.joinUrl ? (
                  <a href={c.joinUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
                    Join class
                  </a>
                ) : (
                  c.status !== 'ended' && <p className="text-xs text-slate-500">The join link appears 10 minutes before the start.</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
