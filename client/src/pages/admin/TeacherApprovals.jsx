import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

// New teacher sign-ups waiting for approval. Approve, or reject with a reason.
export default function TeacherApprovals() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/users?role=teacher&approval=pending&limit=50');

  async function approve(u) {
    try {
      await api.patch(`/admin/teachers/${u._id}/approve`);
      toast.success(`${u.name} is now a teacher`);
      reload();
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function reject(u) {
    const reason = window.prompt('Reason to send the teacher (at least 3 letters):', '');
    if (!reason || reason.trim().length < 3) return;
    try {
      await api.patch(`/admin/teachers/${u._id}/reject`, { reason: reason.trim() });
      toast.success('Application rejected');
      reload();
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Teacher approvals</h1>
        <p className="mt-1 text-slate-600">New teacher sign-ups. A teacher can not upload or sell until approved.</p>
      </div>
      <QueryState loading={loading && !data} error={error} onRetry={reload} retryLabel="Try again"
        empty={!!data && data.users.length === 0} emptyTitle="No one is waiting" emptyText="New teacher sign-ups appear here.">
        <ul className="space-y-3">
          {data?.users.map((u) => (
            <li key={u._id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-slate-800" dir="auto">{u.name}</p>
                  <p className="text-sm text-slate-500" dir="ltr">{u.email}</p>
                  <p className="text-xs text-slate-400">Signed up {formatDateTime(u.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => reject(u)}>Reject</Button>
                  <Button onClick={() => approve(u)}>Approve</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
