import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

const money = (n, c) => (c === 'JPY' ? `¥${Number(n).toLocaleString()}` : `$${n}`);
const day = (d) => new Date(d).toLocaleDateString();
const PILL = {
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-amber-100 text-amber-800',
  due: 'bg-slate-100 text-slate-700',
  overdue: 'bg-red-100 text-red-800',
};
const select = 'h-9 rounded-lg border border-brand-200 bg-white px-2 text-sm';

// Who still owes money, and where each installment stands.
// canManage (admins): change the grace period, free access, automatic emails, waive a part, send a reminder.
export default function Plans({ title, canManage = false, canRemind = false, remindBase = '/admin/plans' }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [status, setStatus] = useState('owing');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState('');
  const { data, loading, error, reload } = useFetch(`/plans?status=${status}&page=${page}&limit=20`);

  async function change(planId, body, done) {
    setBusy(planId);
    try {
      await api.patch(`/admin/plans/${planId}`, body);
      toast.success(done);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function act(planId, path, confirmText, done) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(planId);
    try {
      await api.post(`${remindBase}/${planId}/${path}`);
      toast.success(done);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  }

  const tab = (value, label) => (
    <button
      type="button"
      onClick={() => { setStatus(value); setPage(1); }}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status === value ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-800'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{title}</h1>
        <p className="mt-1 text-slate-600">
          Grace period: after an installment is due, the student keeps access for the grace days. After that the lessons close until they pay.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tab('owing', 'Still owing')}
        {tab('overdue', 'Overdue (past grace)')}
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.plans.length === 0}
        emptyTitle={status === 'overdue' ? 'No overdue installments' : 'Nobody owes money right now'}
        emptyText="Installment balances appear here when a student pays in parts."
      >
        <ul className="space-y-3">
          {data?.plans.map((p) => (
            <li key={p._id}>
              <Card className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800" dir="auto">{p.student?.name ?? '—'}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{p.student?.email}</p>
                    <p className="mt-1 text-sm text-slate-700" dir="auto">{p.course?.title}</p>
                  </div>
                  <div className="text-end text-sm">
                    <p>Paid {money(p.paid, p.currency)} of {money(p.total, p.currency)}</p>
                    <p className="font-semibold text-brand-800">Owes {money(p.remaining, p.currency)}</p>
                    <div className="mt-1 flex flex-wrap justify-end gap-1">
                      {p.overdue && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Overdue</span>}
                      {p.accessMode === 'free' && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Free access</span>}
                      {p.waivedTotal > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Waived {money(p.waivedTotal, p.currency)}</span>}
                    </div>
                  </div>
                </div>

                {p.nextDue && (
                  <p className="text-sm text-slate-600">
                    Next: installment {p.nextDue.no} · {money(p.nextDue.owed, p.currency)} due {day(p.nextDue.dueAt)} · grace until {day(p.nextDue.graceEnds)}
                  </p>
                )}

                {canManage && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm">
                    <label className="flex items-center gap-1">
                      Grace
                      <select className={select} value={p.graceDays} disabled={busy === p._id}
                        onChange={(e) => change(p._id, { graceDays: Number(e.target.value) }, 'Grace period saved')}>
                        {[0, 3, 7, 14, 30, 60].map((d) => <option key={d} value={d}>{d} days</option>)}
                      </select>
                    </label>
                    <label className="flex items-center gap-1">
                      Access
                      <select className={select} value={p.accessMode} disabled={busy === p._id}
                        onChange={(e) => change(p._id, { accessMode: e.target.value }, 'Access saved')}>
                        <option value="normal">Normal (grace applies)</option>
                        <option value="free">Free (no lock)</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={p.emailOnOverdue} disabled={busy === p._id}
                        onChange={(e) => change(p._id, { emailOnOverdue: e.target.checked }, 'Email setting saved')} />
                      Automatic overdue emails
                    </label>
                    <Button variant="outline" size="sm" disabled={!!busy} loading={busy === p._id}
                      onClick={() => act(p._id, 'remind', null, 'Reminder sent')}>
                      Send reminder now
                    </Button>
                    <Button variant="outline" size="sm" disabled={!!busy}
                      onClick={() => act(p._id, 'waive', 'Forgive the next installment? This cannot be undone.', 'Installment waived')}>
                      Waive next installment
                    </Button>
                  </div>
                )}

                {!canManage && canRemind && p.remaining > 0 && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" disabled={!!busy} loading={busy === p._id}
                      onClick={() => act(p._id, 'remind', null, 'Reminder sent to the student')}>
                      Send reminder now
                    </Button>
                  </div>
                )}

                <button type="button" onClick={() => setOpen(open === p._id ? null : p._id)} className="text-sm font-semibold text-brand-700 hover:underline">
                  {open === p._id ? 'Hide installments' : 'Show installments'}
                </button>

                {open === p._id && (
                  <ul className="space-y-1">
                    {p.schedule.map((e) => (
                      <li key={e.no} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="w-24 text-slate-600">{e.no}. {money(e.amount, p.currency)}</span>
                        <span className="text-slate-600">paid {money(e.paid, p.currency)}</span>
                        <span className="text-slate-500">due {day(e.dueAt)}</span>
                        <span className="text-slate-500">grace until {day(e.graceEnds)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[e.status]}`}>{e.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </li>
          ))}
        </ul>
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
