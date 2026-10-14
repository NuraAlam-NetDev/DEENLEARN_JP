import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

const KINDS = ['', 'installment', 'manual', 'payment', 'notification', 'password_reset', 'system'];
const STATUS = { sent: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', skipped: 'bg-slate-100 text-slate-700' };
const select = 'h-10 rounded-lg border border-brand-200 bg-white px-3 text-sm';

// Every email the app sent: what it was, who it went to, and who sent it (admins pressed "send")
export default function EmailLog() {
  const { t } = useTranslation();
  const [kind, setKind] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 350);
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (kind) params.set('kind', kind);
  if (q) params.set('q', q);
  const { data, loading, error, reload } = useFetch(`/email-log?${params}`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Email log</h1>
        <p className="mt-1 text-slate-600">Every email sent by the app. Skipped means SMTP is not set up yet.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={select} value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }}>
          {KINDS.map((k) => <option key={k} value={k}>{k || 'All kinds'}</option>)}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by email address"
          dir="ltr"
          className="h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm sm:max-w-xs"
        />
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.logs.length === 0}
        emptyTitle="No emails yet"
        emptyText="Emails appear here as soon as the app sends one."
      >
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-slate-600">
              <tr>
                <th className="px-3 py-3 text-start font-medium">When</th>
                <th className="px-3 py-3 text-start font-medium">To</th>
                <th className="px-3 py-3 text-start font-medium">Subject</th>
                <th className="px-3 py-3 text-start font-medium">Kind</th>
                <th className="px-3 py-3 text-start font-medium">Sent by</th>
                <th className="px-3 py-3 text-start font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs.map((l) => (
                <tr key={l._id} className="border-t border-brand-50 align-top">
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{formatDateTime(l.createdAt)}</td>
                  <td className="px-3 py-2.5 text-slate-800" dir="ltr">{l.to}</td>
                  <td className="px-3 py-2.5 text-slate-700" dir="auto">{l.subject}</td>
                  <td className="px-3 py-2.5 text-slate-600">{l.kind}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {l.sentBy ? `${l.sentBy.name} (${l.sentBy.role})` : 'System'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[l.status]}`}>{l.status}</span>
                    {l.error && <p className="mt-1 text-xs text-slate-500">{l.error}</p>}
                  </td>
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
