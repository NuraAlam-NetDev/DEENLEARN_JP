import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Card } from '../../components/ui/Card.jsx';

const money = (n, c) => (c === 'JPY' ? `¥${Number(n).toLocaleString()}` : `$${Number(n).toFixed(2)}`);
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

function Stat({ label, value, hint }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-brand-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

// Monthly bars per currency. Net = paid minus refunds.
function Bars({ currency, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.net));
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">{currency}</p>
      <div className="flex h-44 items-end gap-2">
        {rows.map((r) => (
          <div key={r.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${money(r.net, currency)} · ${r.count} payments`}>
            <span className="text-[10px] text-slate-500">{r.net ? (currency === 'JPY' ? Math.round(r.net / 1000) + 'k' : r.net) : ''}</span>
            <div className="w-full rounded-t bg-brand-600" style={{ height: `${(r.net / max) * 100}%`, minHeight: r.net ? '4px' : '0' }} />
            <span className="text-[10px] text-slate-500">{monthLabel(r.month)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Teacher's earnings: this month, all shown months, cash waiting, what students still owe, per course
export default function Earnings() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/teacher/earnings');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Earnings</h1>
        <p className="mt-1 text-slate-600">Only your own courses. Net = paid minus refunds.</p>
      </div>

      <QueryState loading={loading && !data} error={error} onRetry={reload} retryLabel={t('report.retry')}
        empty={!!data && data.months.length === 0} emptyTitle="No earnings yet" emptyText="Approved payments for your courses appear here.">
        {data && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Earned (last 12 months, net)" value={Object.entries(data.totals).map(([c, v]) => money(v.net, c)).join(' · ') || '—'} hint={`${Object.values(data.totals).reduce((s, v) => s + v.count, 0)} payments`} />
              <Stat label="Cash waiting" value={Object.entries(data.cashWaiting).map(([c, v]) => money(v.waitingTeacher + v.waitingAdmin, c)).join(' · ') || '—'} hint="Confirm cash you received in the Cash payments page" />
              <Stat label="Students still owe" value={data.owed.map((o) => money(o.amount, o.currency)).join(' · ') || '—'} hint={`${data.overdueCount} overdue`} />
              <Stat label="Students enrolled" value={data.students} />
            </div>

            <Card className="space-y-5 p-4">
              <h2 className="font-display text-xl font-bold text-brand-800">Month by month</h2>
              {data.months.map((m) => <Bars key={m.currency} currency={m.currency} rows={m.rows} />)}
            </Card>

            <Card className="overflow-x-auto p-4">
              <h2 className="mb-3 font-display text-xl font-bold text-brand-800">Per course</h2>
              <table className="w-full text-sm">
                <thead className="bg-brand-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">Course</th>
                    <th className="px-3 py-2 text-end font-medium">Net</th>
                    <th className="px-3 py-2 text-end font-medium">Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.map((c) => (
                    <tr key={c._id} className="border-t border-brand-50">
                      <td className="px-3 py-2 text-slate-800" dir="auto">{c.title}</td>
                      <td className="px-3 py-2 text-end">{Object.entries(c.byCurrency).map(([cur, v]) => money(v.net, cur)).join(' · ') || '—'}</td>
                      <td className="px-3 py-2 text-end">{Object.values(c.byCurrency).reduce((s, v) => s + v.count, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </QueryState>
    </div>
  );
}
