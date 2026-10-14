import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import QueryState from '../../components/ui/QueryState.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

const METHOD = { whatsapp: 'WhatsApp', telegram: 'Telegram', phone: 'Phone / SMS', email: 'Email only', other: 'Other' };

// Students' addresses and contact preferences. Admins and the super admin only.
export default function StudentContacts() {
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 350);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(`/admin/student-contacts?page=${page}&limit=25${q ? `&q=${encodeURIComponent(q)}` : ''}`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-brand-800">Student contacts</h1>
          <p className="mt-1 text-slate-600">Address and how each student prefers to be reached. Only you can see this page.</p>
        </div>
        <a href="/api/admin/student-contacts?format=csv"
          className="inline-flex h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
          Download CSV
        </a>
      </div>

      <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name or email" dir="ltr"
        className="h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm sm:max-w-xs" />

      <QueryState loading={loading && !data} error={error} onRetry={reload} retryLabel="Try again"
        empty={!!data && data.contacts.length === 0} emptyTitle="No students found" emptyText="Students appear here once they register.">
        <ul className="space-y-3">
          {data?.contacts.map((c) => (
            <li key={c._id}>
              <Card className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800" dir="auto">{c.name}</p>
                    <p className="text-sm text-slate-500" dir="ltr">{c.email}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
                    {METHOD[c.contactMethod]}{c.contactOther ? `: ${c.contactOther}` : ''}
                  </span>
                </div>
                <p className="text-sm text-slate-700" dir="auto">
                  {[c.address, c.city, c.country].filter(Boolean).join(', ') || 'No address yet'}
                </p>
                {c.contactNumber && (
                  <p className="text-sm text-slate-700" dir="ltr">
                    {c.contactNumber}{' '}
                    {c.whatsappLink && (
                      <a href={c.whatsappLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
                        Open WhatsApp
                      </a>
                    )}
                  </p>
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
