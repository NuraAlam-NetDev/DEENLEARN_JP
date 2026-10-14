import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import Alert from '../../components/Alert.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Card, StatCard } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import QueryState from '../../components/ui/QueryState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatMoney } from '../../utils/money.js';

const TONE = { approved: 'green', rejected: 'red', cancelled: 'red', failed: 'red', awaiting_approval: 'gold', cash_pending: 'gold', pending: 'gray' };
const STATUSES = ['', 'approved', 'awaiting_approval', 'cash_pending', 'pending', 'rejected', 'cancelled', 'failed'];
const PROVIDERS = ['', 'stripe', 'cash']; // bKash/Nagad are no longer offered

const tabBtn = (active) =>
  `shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold ${active ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-brand-700'}`;

function Transactions({ t }) {
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 350);
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q, status, provider]);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (q) params.set('q', q);
  if (status) params.set('status', status);
  if (provider) params.set('provider', provider);
  const { data, loading, error, reload } = useFetch(`/admin/finance/transactions?${params}`);

  const selectClass = 'h-10 rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none';
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('adminFinance.searchPlaceholder')}
          aria-label={t('adminFinance.searchPlaceholder')}
          dir="ltr"
          className="h-10 flex-1 rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} aria-label={t('adminFinance.filterStatus')}>
          {STATUSES.map((s) => (
            <option key={s || 'all'} value={s}>{s ? t(`orders.status.${s}`) : t('adminFinance.allStatuses')}</option>
          ))}
        </select>
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className={selectClass} aria-label={t('adminFinance.filterMethod')}>
          {PROVIDERS.map((p) => (
            <option key={p || 'all'} value={p}>{p ? t(`orders.provider.${p}`) : t('adminFinance.allMethods')}</option>
          ))}
        </select>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.transactions.length === 0}
        emptyTitle={t('adminFinance.emptyTitle')}
        emptyText={t('adminFinance.emptyText')}
      >
              {data && data.transactions.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-brand-100 bg-white">
            <table className="w-full min-w-[60rem] text-start text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-slate-500">
                  <th className="px-3 py-3 text-start font-medium">{t('adminFinance.cols.date')}</th>
                  <th className="px-3 py-3 text-start font-medium">{t('adminFinance.cols.student')}</th>
                  <th className="px-3 py-3 text-start font-medium">{t('adminFinance.cols.course')}</th>
                  <th className="px-3 py-3 text-start font-medium">{t('adminFinance.cols.method')}</th>
                  <th className="px-3 py-3 text-end font-medium">{t('adminFinance.cols.amount')}</th>
                  <th className="px-3 py-3 text-start font-medium">{t('adminFinance.cols.status')}</th>
                  <th className="px-3 py-3 text-start font-medium">{t('adminFinance.cols.txn')}</th>
                  <th className="px-3 py-3 text-start font-medium">{t('adminFinance.cols.reviewer')}</th>
                  <th className="px-3 py-3 text-start font-medium">{t('adminFinance.cols.reason')}</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((o) => (
                  <tr key={o._id} className="border-b border-brand-50 align-middle">
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{formatDateTime(o.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-800" dir="auto">{o.student?.name}</p>
                      <p className="text-xs text-slate-500" dir="ltr">{o.student?.email}</p>
                    </td>
                    <td className="px-3 py-2.5" dir="auto">{o.course?.title}</td>
                    <td className="px-3 py-2.5">{t(`orders.provider.${o.provider}`)}</td>
                    <td className="px-3 py-2.5 text-end font-semibold">{formatMoney(o.amount, o.currency)}</td>
                    <td className="px-3 py-2.5"><Badge tone={TONE[o.status] ?? 'gray'}>{t(`orders.status.${o.status}`)}</Badge></td>
                    <td className="break-all px-3 py-2.5 font-mono text-xs text-slate-600" dir="ltr">{o.gatewayTxnId || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-700" dir="auto">{o.reviewedBy?.name ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600" dir="auto">{o.rejectReason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
      </QueryState>
    </div>
  );
}

function Reports({ t }) {
  const { data, loading, error, reload } = useFetch('/admin/finance/reports');
  if (loading && !data) return <Spinner />;
  if (error) {
    return (
      <Alert>
        {error}{' '}
        <button type="button" onClick={reload} className="font-semibold underline">{t('report.retry')}</button>
      </Alert>
    );
  }
  if (!data) return null;

  const c = data.counts;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('adminFinance.counts.approved')} value={c.approved ?? 0} />
        <StatCard label={t('adminFinance.counts.waiting')} value={(c.awaiting_approval ?? 0) + (c.cash_pending ?? 0)} />
        <StatCard label={t('adminFinance.counts.rejected')} value={c.rejected ?? 0} />
        <StatCard label={t('adminFinance.counts.lost')} value={(c.cancelled ?? 0) + (c.failed ?? 0)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.revenue.length === 0 && <p className="text-sm text-slate-500">{t('adminFinance.noRevenue')}</p>}
        {data.revenue.map((r) => (
          <StatCard
            key={r.currency}
            label={t('adminFinance.revenue', { currency: r.currency })}
            value={`${r.total.toLocaleString()} ${r.currency}`}
            hint={t('adminFinance.sold', { n: r.count })}
          />
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold text-brand-800">{t('adminFinance.monthly')}</h2>
        {data.monthly.length === 0 ? (
          <p className="text-sm text-slate-500">{t('adminFinance.noMonthly')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-100">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-slate-500">
                  <th className="px-3 py-2 text-start font-medium">{t('adminFinance.cols.month')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('adminFinance.cols.currency')}</th>
                  <th className="px-3 py-2 text-end font-medium">{t('adminFinance.cols.total')}</th>
                  <th className="px-3 py-2 text-end font-medium">{t('adminFinance.cols.sold')}</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((m) => (
                  <tr key={`${m.year}-${m.month}-${m.currency}`} className="border-b border-brand-50">
                    <td className="px-3 py-2">{m.year}-{String(m.month).padStart(2, '0')}</td>
                    <td className="px-3 py-2">{m.currency}</td>
                    <td className="px-3 py-2 text-end">{m.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-end">{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold text-brand-800">{t('adminFinance.topCourses')}</h2>
        {data.topCourses.length === 0 ? (
          <p className="text-sm text-slate-500">{t('adminFinance.noTop')}</p>
        ) : (
          <ul className="divide-y divide-brand-50 rounded-xl border border-brand-100 bg-white">
            {data.topCourses.map((r) => (
              <li key={`${r.courseId}-${r.currency}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-800" dir="auto">{r.title}</span>
                <span className="shrink-0 text-end">
                  <span className="font-semibold">{r.total.toLocaleString()} {r.currency}</span>
                  <span className="block text-xs text-slate-500">{t('adminFinance.sold', { n: r.count })}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// /admin/finance : payment history and revenue reports
export default function AdminFinance() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('transactions');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('adminFinance.title')}</h1>
        <p className="mt-1 text-slate-600">{t('adminFinance.subtitle')}</p>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-brand-100" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'transactions'} className={tabBtn(tab === 'transactions')} onClick={() => setTab('transactions')}>
          {t('adminFinance.tabs.transactions')}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'reports'} className={tabBtn(tab === 'reports')} onClick={() => setTab('reports')}>
          {t('adminFinance.tabs.reports')}
        </button>
      </div>
      <Card>
        <div className="p-4 sm:p-5">
          {tab === 'transactions' ? <Transactions t={t} /> : <Reports t={t} />}
        </div>
      </Card>
    </div>
  );
}
