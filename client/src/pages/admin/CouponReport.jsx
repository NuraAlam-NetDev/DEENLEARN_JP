import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Card } from '../../components/ui/Card.jsx';

const money = (n, c) => (c === 'JPY' ? `¥${Number(n).toLocaleString()}` : `${Number(n).toFixed(2)} ${c}`);

// Every discount code: how often it was used on approved payments, the discount given, the revenue it brought
export default function CouponReport() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/admin/coupons/report');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Discount code report</h1>
        <p className="mt-1 text-slate-600">Used = approved payments that used the code. Reserved counts a try, including payments not finished.</p>
      </div>
      <QueryState loading={loading && !data} error={error} onRetry={reload} retryLabel={t('report.retry')}
        empty={!!data && data.coupons.length === 0} emptyTitle="No codes yet" emptyText="Create codes in Discount codes.">
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-start font-medium">Code</th>
                <th className="px-3 py-2 text-start font-medium">Discount</th>
                <th className="px-3 py-2 text-start font-medium">Course</th>
                <th className="px-3 py-2 text-end font-medium">Used</th>
                <th className="px-3 py-2 text-end font-medium">Reserved</th>
                <th className="px-3 py-2 text-end font-medium">Discount given</th>
                <th className="px-3 py-2 text-end font-medium">Revenue</th>
                <th className="px-3 py-2 text-start font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.coupons.map((c) => {
                const cur = Object.entries(c.byCurrency);
                return (
                  <tr key={c._id} className="border-t border-brand-50 align-top">
                    <td className="px-3 py-2 font-mono font-semibold text-slate-800">{c.code}</td>
                    <td className="px-3 py-2">{c.kind === 'percent' ? `${c.value}%` : `${c.value}`}{c.currency !== 'ANY' ? ` ${c.currency}` : ''}</td>
                    <td className="px-3 py-2 text-slate-700" dir="auto">{c.course}</td>
                    <td className="px-3 py-2 text-end">{c.orders}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                    <td className="px-3 py-2 text-end">{c.reserved}</td>
                    <td className="px-3 py-2 text-end">{cur.map(([k, v]) => money(v.discount, k)).join(' · ') || '—'}</td>
                    <td className="px-3 py-2 text-end">{cur.map(([k, v]) => money(v.revenue, k)).join(' · ') || '—'}</td>
                    <td className="px-3 py-2">{c.active ? 'Active' : 'Off'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </QueryState>
    </div>
  );
}
