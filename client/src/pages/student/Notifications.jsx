import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import api from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Card } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

// Everything the app has told the student: payments, quiz results, new lessons
export default function Notifications() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/notifications');

  async function markAll() {
    await api.patch('/notifications/read-all');
    reload();
    window.dispatchEvent(new Event('notifications-changed'));
  }

  async function open(n) {
    if (!n.read) {
      await api.patch(`/notifications/${n._id}/read`);
      window.dispatchEvent(new Event('notifications-changed'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">{t('extras.notifications.title')}</h1>
          <p className="mt-1 text-slate-600">{data ? t('extras.notifications.unread', { n: data.unread }) : ''}</p>
        </div>
        {data?.unread > 0 && <Button variant="outline" onClick={markAll}>{t('extras.notifications.markAll')}</Button>}
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.items.length === 0}
        emptyTitle={t('extras.notifications.empty')}
        emptyText={t('extras.notifications.emptyText')}
      >
        <ul className="space-y-3">
          {data?.items.map((n) => (
            <li key={n._id}>
              <Card className={`p-4 ${n.read ? '' : 'border-s-4 border-s-gold-500'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800" dir="auto">{n.title}</p>
                    {n.body && <p className="mt-1 text-sm text-slate-600" dir="auto">{n.body}</p>}
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {n.link && (
                    <Link to={n.link} onClick={() => open(n)} className="text-sm font-semibold text-brand-700 hover:underline">
                      {t('extras.notifications.open')}
                    </Link>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
