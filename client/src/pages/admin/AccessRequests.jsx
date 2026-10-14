import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

// Students who asked for free access to a course they still owe on
export default function AccessRequests() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/access-requests?status=pending&limit=50');

  async function decide(r, decision) {
    const note = decision === 'reject' ? window.prompt('Reason to send the student (optional):') ?? '' : '';
    if (decision === 'reject' && note === null) return;
    try {
      await api.patch(`/access-requests/${r._id}`, { decision, note });
      toast.success(decision === 'approve' ? 'Free access given' : 'Request rejected');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Free-access requests</h1>
        <p className="mt-1 text-slate-600">Approve to unlock the lessons now, even if the balance is still owed.</p>
      </div>

      <QueryState loading={loading && !data} error={error} onRetry={reload} retryLabel={t('report.retry')}
        empty={!!data && data.requests.length === 0} emptyTitle="No waiting requests" emptyText="New requests appear here.">
        <ul className="space-y-3">
          {data?.requests.map((r) => (
            <li key={r._id}>
              <Card className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800" dir="auto">{r.student?.name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{r.student?.email}</p>
                    <p className="mt-1 text-sm text-slate-700" dir="auto">{r.course?.title}</p>
                    <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
                      {r.type === 'enrollment' ? 'Free enrollment (not bought)' : 'Free access (owes a balance)'}
                    </span>
                    {r.reason && <p className="mt-1 text-sm text-slate-600" dir="auto">"{r.reason}"</p>}
                  </div>
                  <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => decide(r, 'reject')}>Reject</Button>
                  <Button onClick={() => decide(r, 'approve')}>{r.type === 'enrollment' ? 'Approve enrollment' : 'Approve free access'}</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
