import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDate } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

// Give a parent or guardian a private, read-only view of your progress (no login needed). You can cancel it any time.
export default function ParentLinks() {
  const toast = useToast();
  const { data, reload } = useFetch('/parent-links');
  const [label, setLabel] = useState('');
  const [fresh, setFresh] = useState(null);
  const [busy, setBusy] = useState(false);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: res } = await api.post('/parent-links', { label: label.trim() });
      setFresh(res.url);
      setLabel('');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id) {
    if (!window.confirm('Cancel this link? The parent will no longer be able to open it.')) return;
    await api.delete(`/parent-links/${id}`);
    reload();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Parent view</h1>
        <p className="mt-1 text-slate-600">
          A link for your parent or guardian. They see your course progress and certificates. They cannot see your payments, email or messages.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium text-slate-700">Name for this link (optional)</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60}
              className="h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm" placeholder="e.g. Father" />
          </label>
          <Button type="submit" loading={busy}>Create link</Button>
        </form>
        {fresh && (
          <div className="mt-4 space-y-2 rounded-lg bg-brand-50 p-3">
            <p className="text-sm text-slate-700">Copy this link now. It is shown only once.</p>
            <input readOnly value={fresh} onFocus={(e) => e.target.select()} dir="ltr"
              className="h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-xs" />
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(fresh).then(() => toast.success('Copied'))}>Copy</Button>
          </div>
        )}
      </Card>

      <ul className="space-y-2">
        {data?.links.map((l) => (
          <li key={l._id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-slate-800">{l.label || 'Parent link'}</p>
                <p className="text-xs text-slate-500">Valid until {formatDate(l.expiresAt)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => revoke(l._id)}>Cancel link</Button>
            </Card>
          </li>
        ))}
        {data && data.links.length === 0 && <p className="text-sm text-slate-500">No active links.</p>}
      </ul>
    </div>
  );
}
