import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import Alert from '../../components/Alert.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatMoney } from '../../utils/money.js';

const TONE = { approved: 'green', rejected: 'red' };

// /admin/orders : payments waiting for approval, and the decisions this admin has made
export default function AdminOrders() {
  const { t } = useTranslation();
  const toast = useToast();
  const [tab, setTab] = useState('waiting');
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 350);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');

  useEffect(() => setPage(1), [q, tab]);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (tab === 'waiting' && q) params.set('q', q);
  const path = tab === 'waiting' ? '/admin/orders' : '/admin/orders/history';
  const { data, loading, error, reload } = useFetch(`${path}?${params}`);

  async function approve(o) {
    if (!window.confirm(t('adminOrders.confirmApprove', { name: o.student?.name, course: o.course?.title }))) return;
    setBusy(o._id);
    try {
      await api.patch(`/admin/orders/${o._id}/approve`);
      toast.success(t('adminOrders.approvedToast'));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function reject(o) {
    const reason = window.prompt(t('adminOrders.rejectPrompt'));
    if (!reason || reason.trim().length < 3) return;
    setBusy(o._id);
    try {
      await api.patch(`/admin/orders/${o._id}/reject`, { reason: reason.trim() });
      toast.success(t('adminOrders.rejectedToast'));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  }

  const tabClass = (active) =>
    `shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold ${
      active ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-brand-700'
    }`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('adminOrders.title')}</h1>
        <p className="mt-1 text-slate-600">{t('adminOrders.subtitle')}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-brand-100" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'waiting'} className={tabClass(tab === 'waiting')} onClick={() => setTab('waiting')}>
          {t('adminOrders.tabWaiting')}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'history'} className={tabClass(tab === 'history')} onClick={() => setTab('history')}>
          {t('adminOrders.tabHistory')}
        </button>
      </div>

      {tab === 'waiting' && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('adminOrders.search')}
          aria-label={t('adminOrders.search')}
          dir="ltr"
          className="h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 sm:max-w-sm"
        />
      )}

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.orders.length === 0}
        emptyTitle={tab === 'waiting' ? t('adminOrders.emptyTitle') : t('adminOrders.historyEmpty')}
        emptyText={tab === 'waiting' ? t('adminOrders.emptyText') : t('adminOrders.historyEmptyText')}
      >
        {data && data.orders.length > 0 && (
          <>
            <ul className="space-y-3">
              {data.orders.map((o) => (
                <li key={o._id}>
                  <Card className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800" dir="auto">{o.student?.name}</p>
                        <p className="text-xs text-slate-500" dir="ltr">{o.student?.email}</p>
                        <p className="mt-1 text-sm text-slate-700" dir="auto">{o.course?.title}</p>
                      </div>
                      <div className="text-end">
                        <p className="font-display text-xl font-bold text-brand-800">
                          {formatMoney(o.amount, o.currency)}
                        </p>
                        <p className="text-xs text-slate-500">{t(`orders.provider.${o.provider}`)}</p>
                        {tab === 'history' && (
                          <Badge tone={TONE[o.status] ?? 'gray'} className="mt-1">{t(`orders.status.${o.status}`)}</Badge>
                        )}
                      </div>
                    </div>

                    {tab === 'waiting' ? (
                      <>
                        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <p>
                            <span className="text-slate-500">{t('adminOrders.txn')}: </span>
                            <span className="break-all font-mono text-slate-800" dir="ltr">{o.gatewayTxnId || '—'}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {t('adminOrders.requested')}: {formatDateTime(o.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="danger" disabled={!!busy} onClick={() => reject(o)}>
                            {t('adminOrders.reject')}
                          </Button>
                          <Button loading={busy === o._id} disabled={!!busy} onClick={() => approve(o)}>
                            {t('adminOrders.approve')}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <p className="text-xs text-slate-500">
                          {t('adminOrders.decidedOn')}: {formatDateTime(o.reviewedAt)}
                        </p>
                        {o.status === 'rejected' && (
                          <p className="text-slate-700">
                            <span className="text-slate-500">{t('adminOrders.reasonLabel')}: </span>
                            <span dir="auto">{o.rejectReason || '—'}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  );
}
