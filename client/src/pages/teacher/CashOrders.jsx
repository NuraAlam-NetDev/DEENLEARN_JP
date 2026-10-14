import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import Alert from '../../components/Alert.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { formatMoney } from '../../utils/money.js';

// /teacher/cash : cash payments students have made to me. I confirm once the money is in hand.
export default function CashOrders() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/teacher/cash-orders');
  const [receipt, setReceipt] = useState({});
  const [busy, setBusy] = useState('');

  async function act(order, action) {
    let body = {};
    if (action === 'reject') {
      const reason = window.prompt(t('cash.rejectPrompt'));
      if (!reason || reason.trim().length < 3) return;
      body = { reason: reason.trim() };
    } else {
      body = { receiptNo: receipt[order._id] || '' };
    }
    setBusy(order._id);
    try {
      await api.patch(`/teacher/cash-orders/${order._id}/${action}`, body);
      toast.success(action === 'confirm' ? t('cash.confirmedToast') : t('cash.rejectedToast'));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('cash.teacherTitle')}</h1>
        <p className="mt-1 text-slate-600">{t('cash.teacherSubtitle')}</p>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.orders.length === 0}
        emptyTitle={t('cash.emptyTitle')}
        emptyText={t('cash.emptyText')}
      >
              {data && data.orders.length > 0 && (
        <ul className="space-y-3">
          {data.orders.map((o) => (
            <li key={o._id}>
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800" dir="auto">{o.student?.name}</p>
                  <p className="text-xs text-slate-500" dir="auto">{o.student?.email}</p>
                  <p className="mt-1 text-sm text-slate-700" dir="auto">{o.course?.title}</p>
                </div>
                <div className="text-end">
                  <p className="font-display text-xl font-bold text-brand-800">{formatMoney(o.amount, o.currency)}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={receipt[o._id] || ''}
                  onChange={(e) => setReceipt({ ...receipt, [o._id]: e.target.value })}
                  placeholder={t('cash.receiptPlaceholder')}
                  aria-label={t('cash.receiptLabel')}
                  maxLength={60}
                  className="h-10 flex-1 rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600"
                />
                <Button loading={busy === o._id} disabled={!!busy} onClick={() => act(o, 'confirm')}>
                  {t('cash.confirm')}
                </Button>
                <Button variant="danger" disabled={!!busy} onClick={() => act(o, 'reject')}>
                  {t('cash.reject')}
                </Button>
              </div>
            </Card>
            </li>
          ))}
        </ul>
      )}
      </QueryState>
    </div>
  );
}
