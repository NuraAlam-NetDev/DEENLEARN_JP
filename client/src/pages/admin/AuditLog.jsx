import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import Alert from '../../components/Alert.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import QueryState from '../../components/ui/QueryState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';

const ROLE_TONE = { student: 'gray', teacher: 'green', admin: 'green', super_admin: 'gold' };

// /admin/audit : who changed what, and when. Super admin only (the server answers 404 to everyone else).
export default function AuditLog() {
  const { t } = useTranslation();
  const [action, setAction] = useState('');
  const q = useDebounce(action.trim(), 350);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q, from, to]);

  const params = new URLSearchParams({ page: String(page), limit: '30' });
  if (q) params.set('action', q);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data, loading, error, reload } = useFetch(`/super/audit?${params}`);

  const input = 'h-10 rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('auditLog.title')}</h1>
        <p className="mt-1 text-slate-600">{t('auditLog.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder={t('auditLog.searchPlaceholder')}
          aria-label={t('auditLog.searchPlaceholder')}
          dir="ltr"
          className={`${input} flex-1`}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          {t('auditLog.from')}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          {t('auditLog.to')}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </label>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.logs.length === 0}
        emptyTitle={t('auditLog.emptyTitle')}
        emptyText={t('auditLog.emptyText')}
      >
              {data && data.logs.length > 0 && (
        <>
          <Card>
            <div className="overflow-x-auto p-2">
              <table className="w-full min-w-[56rem] text-start text-sm">
                <thead>
                  <tr className="border-b border-brand-100 text-slate-500">
                    <th className="px-3 py-3 text-start font-medium">{t('auditLog.cols.when')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('auditLog.cols.who')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('auditLog.cols.action')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('auditLog.cols.target')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('auditLog.cols.result')}</th>
                    <th className="px-3 py-3 text-start font-medium">{t('auditLog.cols.ip')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((l) => (
                    <tr key={l._id} className="border-b border-brand-50 align-middle">
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{formatDateTime(l.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-800" dir="auto">{l.actor?.name ?? '—'}</p>
                        <p className="text-xs text-slate-500" dir="ltr">{l.actor?.email}</p>
                        <Badge tone={ROLE_TONE[l.actorRole] ?? 'gray'} className="mt-1">
                          {t(`admin.roles.${l.actorRole}`)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-700" dir="ltr">
                        {l.action}
                        {l.keys?.length > 0 && (
                          <span className="block text-slate-400">{t('auditLog.fields', { list: l.keys.join(', ') })}</span>
                        )}
                      </td>
                      <td className="break-all px-3 py-2.5 font-mono text-xs text-slate-500" dir="ltr">{l.targetId || '—'}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={l.status < 300 ? 'green' : 'red'}>{l.status}</Badge>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-500" dir="ltr">{l.ip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
      </QueryState>
    </div>
  );
}
