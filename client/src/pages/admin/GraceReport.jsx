import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Card } from '../../components/ui/Card.jsx';

const money = (n, c) => (c === 'JPY' ? `¥${Number(n).toLocaleString()}` : `$${n}`);

// Super admin only: every grace, free-access and waiver decision, and how many emails each person sent
export default function GraceReport() {
  const { data, loading, error, reload } = useFetch('/super/grace-report');
  const isEmpty = !!data && data.policies.length === 0 && data.emailsByPerson.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Grace and email report</h1>
        <p className="mt-1 text-slate-600">Only the super admin sees this page. Changes are also in the audit log.</p>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel="Try again"
        empty={isEmpty}
        emptyTitle="Nothing to report yet"
        emptyText="Grace changes, free access, waivers and emails show up here."
      >
        <div className="space-y-6">
          <Card className="space-y-3 p-4">
            <h2 className="font-display text-xl font-bold text-brand-800">Emails by person</h2>
            {data?.emailsByPerson.length === 0 && <p className="text-sm text-slate-500">No emails sent by admins yet.</p>}
            <ul className="space-y-2 text-sm">
              {data?.emailsByPerson.map((p) => (
                <li key={p.name + p.role} className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-50 pt-2">
                  <span className="font-semibold text-slate-800">{p.name} <span className="text-xs text-slate-500">({p.role})</span></span>
                  <span className="text-slate-600">
                    {Object.entries(p.kinds).map(([k, n]) => `${k}: ${n}`).join(' · ')} · total {p.total}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="font-display text-xl font-bold text-brand-800">Emails by kind (all)</h2>
            <p className="text-sm text-slate-600">
              {data?.emailsByKind.map((k) => `${k.kind}: ${k.n}`).join(' · ') || 'No emails yet.'}
            </p>
          </Card>

          <Card className="overflow-x-auto p-4">
            <h2 className="mb-3 font-display text-xl font-bold text-brand-800">Plans with a changed policy</h2>
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">Student</th>
                  <th className="px-3 py-2 text-start font-medium">Course</th>
                  <th className="px-3 py-2 text-start font-medium">Grace</th>
                  <th className="px-3 py-2 text-start font-medium">Access</th>
                  <th className="px-3 py-2 text-start font-medium">Auto email</th>
                  <th className="px-3 py-2 text-end font-medium">Waived</th>
                  <th className="px-3 py-2 text-start font-medium">Changed by</th>
                  <th className="px-3 py-2 text-start font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {data?.policies.map((p) => (
                  <tr key={p._id} className="border-t border-brand-50">
                    <td className="px-3 py-2 text-slate-800">{p.student?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-700" dir="auto">{p.course}</td>
                    <td className="px-3 py-2">{p.graceDays} days</td>
                    <td className="px-3 py-2">{p.accessMode === 'free' ? 'Free' : 'Normal'}</td>
                    <td className="px-3 py-2">{p.emailOnOverdue ? 'On' : 'Off'}</td>
                    <td className="px-3 py-2 text-end">{p.waivedTotal ? money(p.waivedTotal, p.currency) : '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{p.policyBy ? `${p.policyBy.name} (${p.policyBy.role})` : '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-500">{p.policyAt ? formatDateTime(p.policyAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </QueryState>
    </div>
  );
}
