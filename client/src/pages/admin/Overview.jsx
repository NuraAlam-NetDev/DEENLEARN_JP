import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { useTranslation } from 'react-i18next';

const money = (n, c) => (c === 'JPY' ? `¥${Number(n).toLocaleString()}` : `$${Number(n).toFixed(2)}`);

function Stat({ label, value, hint }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-brand-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

function Money({ rows }) {
  if (!rows?.length) return '—';
  return rows.map((r) => money(r.net, r.currency)).join(' · ');
}

// Admin home: today and this month, what is still owed, overdue, new students, and what is waiting
export default function Overview() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/admin/overview');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Overview</h1>
        <p className="mt-1 text-slate-600">Money in, money still owed, and what needs your attention.</p>
      </div>

      <QueryState loading={loading && !data} error={error} onRetry={reload} retryLabel={t('report.retry')}
        empty={false} emptyTitle="" emptyText="">
        {data && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Revenue today (net)" value={<Money rows={data.today} />} hint={`${data.today.reduce((s, r) => s + r.count, 0)} payments`} />
              <Stat label="Revenue this month (net)" value={<Money rows={data.month} />} hint={`${data.month.reduce((s, r) => s + r.count, 0)} payments`} />
              <Stat label="Still owed" value={data.owed.length ? data.owed.map((o) => money(o.amount, o.currency)).join(' · ') : '—'} hint={`${data.plansOwing} students with a balance`} />
              <Stat label="Overdue (past grace)" value={data.overdueCount} hint="Students whose lessons are locked" />
              <Stat label="New students this month" value={data.newStudentsThisMonth} />
              <Stat label="Waiting: card payments" value={data.pending.cardPayments} hint="Usually none: card payments are approved automatically" />
              <Stat label="Waiting: cash payments" value={data.pending.cashPayments} hint="Teacher to confirm, then approve" />
              <Stat label="Waiting: free-access requests" value={data.pending.accessRequests} />
            </div>
            <Card className="p-4">
              <p className="text-sm text-slate-600">
                Refunds this month: {data.refundsThisMonth.length
                  ? data.refundsThisMonth.map((r) => `${money(r.gross, r.currency)} (${r.count})`).join(' · ')
                  : 'none'}
              </p>
            </Card>
          </div>
        )}
      </QueryState>
    </div>
  );
}
