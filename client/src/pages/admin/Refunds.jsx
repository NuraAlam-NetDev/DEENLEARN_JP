import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

const money = (n, c) => (c === 'JPY' ? `¥${Number(n).toLocaleString()}` : `$${n}`);

// Refund a payment (card through Stripe, cash recorded by hand) and see the refund log
export default function Refunds() {
  const { t } = useTranslation();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const payments = useFetch(`/admin/finance/transactions?status=approved&page=${page}&limit=20`);
  const log = useFetch('/admin/refunds?page=1&limit=20');

  async function refund(o) {
    const left = o.amount - (o.refundedAmount || 0);
    const amountText = window.prompt(`Amount to refund (up to ${left} ${o.currency}). Leave empty for all.`, '');
    if (amountText === null) return;
    const reason = window.prompt('Reason (required, visible in the log and sent to the student):', '');
    if (!reason || reason.trim().length < 3) return toast.error('Write a reason (at least 3 letters)');
    const body = { reason: reason.trim() };
    if (amountText.trim()) body.amount = Number(amountText);
    if (!window.confirm(`Refund ${body.amount ?? left} ${o.currency} to ${o.student?.name}? This cannot be undone.`)) return;
    try {
      const { data } = await api.post(`/admin/orders/${o._id}/refund`, body);
      toast.success(`Refunded ${data.refunded} ${o.currency} (${data.method === 'stripe' ? 'Stripe' : 'recorded'})`);
      payments.reload();
      log.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Refunds</h1>
        <p className="mt-1 text-slate-600">Card refunds go back through Stripe. Cash refunds are recorded after you have handed the money back.</p>
      </div>

      <QueryState loading={payments.loading && !payments.data} error={payments.error} onRetry={payments.reload} retryLabel={t('report.retry')}
        empty={!!payments.data && payments.data.transactions.length === 0} emptyTitle="No payments to refund" emptyText="Approved payments appear here.">
        <ul className="space-y-2">
          {payments.data?.transactions.map((o) => (
            <li key={o._id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800" dir="auto">{o.student?.name} · {o.course?.title}</p>
                  <p className="text-xs text-slate-500">
                    {money(o.amount, o.currency)} paid by {o.provider === 'stripe' ? 'card' : 'cash'}
                    {o.refundedAmount ? ` · refunded ${money(o.refundedAmount, o.currency)}` : ''}
                  </p>
                </div>
                {o.amount - (o.refundedAmount || 0) > 0 && (
                  <Button variant="danger" size="sm" onClick={() => refund(o)}>Refund</Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </QueryState>
      {payments.data && payments.data.pages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-slate-600">{page} / {payments.data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= payments.data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Card className="space-y-3 p-4">
        <h2 className="font-display text-xl font-bold text-brand-800">Refund log</h2>
        {log.data?.refunds.length === 0 && <p className="text-sm text-slate-500">No refunds yet.</p>}
        <ul className="space-y-2 text-sm">
          {log.data?.refunds.map((r) => (
            <li key={r._id} className="flex flex-wrap justify-between gap-2 border-t border-brand-50 pt-2">
              <span className="text-slate-800">{r.student?.name} · {r.course?.title} · {money(r.amount, r.currency)} ({r.method})</span>
              <span className="text-slate-600">{r.reason} · by {r.refundedBy?.name} ({r.refundedBy?.role}) · {formatDateTime(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
