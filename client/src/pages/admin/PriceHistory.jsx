import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { useTranslation } from 'react-i18next';

const money = (n, c) => (c === 'JPY' ? `¥${Number(n).toLocaleString()}` : `$${n}`);
const select = 'h-10 rounded-lg border border-brand-200 bg-white px-3 text-sm';

// /admin/prices : every price change on the platform, and what sales came in after it
export default function PriceHistory() {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState('');
  const [direction, setDirection] = useState('');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (currency) params.set('currency', currency);
  if (direction) params.set('direction', direction);
  const { data, loading, error, reload } = useFetch(`/admin/prices/history?${params}`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Price changes</h1>
        <p className="mt-1 text-slate-600">
          Every course price change. "Sales after" counts approved payments in the {data?.changes?.[0]?.daysAfter ?? 30} days after the change.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={select} value={currency} onChange={(e) => { setCurrency(e.target.value); setPage(1); }}>
          <option value="">All currencies</option>
          <option value="JPY">JPY</option>
          <option value="USD">USD</option>
        </select>
        <select className={select} value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1); }}>
          <option value="">Up and down</option>
          <option value="up">Price up</option>
          <option value="down">Price down</option>
        </select>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.changes.length === 0}
        emptyTitle="No price changes yet"
        emptyText="When a teacher or admin changes a course price, it appears here."
      >
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-start text-slate-600">
              <tr>
                <th className="px-3 py-3 text-start font-medium">When</th>
                <th className="px-3 py-3 text-start font-medium">Course</th>
                <th className="px-3 py-3 text-start font-medium">Change</th>
                <th className="px-3 py-3 text-start font-medium">Changed by</th>
                <th className="px-3 py-3 text-end font-medium">Sales after</th>
                <th className="px-3 py-3 text-end font-medium">Revenue after</th>
              </tr>
            </thead>
            <tbody>
              {data?.changes.map((c) => (
                <tr key={c._id} className="border-t border-brand-50">
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{formatDateTime(c.changedAt)}</td>
                  <td className="px-3 py-2.5 text-slate-800" dir="auto">{c.course?.title ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={c.direction === 'up' ? 'text-green-700' : 'text-red-700'}>
                      {c.direction === 'up' ? '▲' : '▼'} {money(c.from, c.currency)} → {money(c.to, c.currency)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{c.changedBy || '—'} <span className="text-xs text-slate-400">({c.changedByRole})</span></td>
                  <td className="px-3 py-2.5 text-end">{c.salesAfter}</td>
                  <td className="px-3 py-2.5 text-end">{money(c.revenueAfter, c.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </QueryState>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-slate-600">{page} / {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
