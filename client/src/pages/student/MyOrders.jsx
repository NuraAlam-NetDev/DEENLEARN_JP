import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { formatMoney } from '../../utils/money.js';

const TONE = {
  approved: 'green',
  rejected: 'red',
  cancelled: 'red',
  failed: 'red',
  awaiting_approval: 'gold',
  cash_pending: 'gold',
  pending: 'gray',
};

// /student/orders : every payment I have made and where it stands now
export default function MyOrders() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/payments/orders/mine');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('orders.title')}</h1>
        <p className="mt-1 text-slate-600">{t('orders.subtitle')}</p>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.orders.length === 0}
        emptyTitle={t('orders.empty.title')}
        emptyText={t('orders.empty.text')}
      >
        <ul className="space-y-3">
          {data?.orders.map((o) => (
            <li key={o._id}>
              <Card className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800" dir="auto">{o.courseTitle || t('orders.deletedCourse')}</p>
                    <p className="text-xs text-slate-500">
                      {t(`orders.provider.${o.provider}`)} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-display text-lg font-bold text-brand-800">
                      {formatMoney(o.amount, o.currency)}
                    </p>
                    <Badge tone={TONE[o.status] ?? 'gray'}>{t(`orders.status.${o.status}`)}</Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600">{t(`orders.hint.${o.status}`, { reason: o.rejectReason || '—' })}</p>

                {o.status === 'approved' && (
                  <a href={`/api/receipts/${o._id}`} className="inline-block text-sm font-semibold text-brand-700 hover:underline">
                    {t('extras.receipt.download')}
                  </a>
                )}
                {o.status === 'approved' && o.courseId && (
                  <Link to="/student/courses" className="inline-block text-sm font-semibold text-brand-700 hover:underline">
                    {t('orders.openCourse')}
                  </Link>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
