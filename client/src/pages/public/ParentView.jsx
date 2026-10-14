import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDate } from '../../utils/format.js';
import { Card } from '../../components/ui/Card.jsx';

// Read-only progress for a parent or guardian. Opened with the private link from the student.
export default function ParentView() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/parent/${encodeURIComponent(token)}`)
      .then(({ data: res }) => setData(res))
      .catch((err) => setError(getErrorMessage(err)));
  }, [token]);

  if (error) return <div className="mx-auto max-w-md py-12"><Card className="p-6 text-slate-700">{error}</Card></div>;
  if (!data) return <div className="mx-auto max-w-md py-12 text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <div>
        <p className="text-sm text-slate-500">Deenlearn · read-only progress</p>
        <h1 className="text-3xl font-bold text-brand-800">{data.studentName}</h1>
        {data.lastActivityAt && <p className="mt-1 text-sm text-slate-600">Last studied: {formatDate(data.lastActivityAt)}</p>}
      </div>

      <Card className="space-y-3 p-5">
        <h2 className="font-display text-xl font-bold text-brand-800">Courses</h2>
        {data.courses.length === 0 && <p className="text-sm text-slate-500">No courses yet.</p>}
        {data.courses.map((c) => (
          <div key={c.title}>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-800" dir="auto">{c.title}</span>
              <span className="text-slate-600">{c.completed ? 'Completed' : `${Math.round(c.progress)}%`}</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-brand-50">
              <div className="h-2 rounded-full bg-brand-600" style={{ width: `${Math.min(100, Math.round(c.progress))}%` }} />
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="font-display text-xl font-bold text-brand-800">Certificates</h2>
        {data.certificates.length === 0 && <p className="text-sm text-slate-500">None yet.</p>}
        <ul className="space-y-1 text-sm">
          {data.certificates.map((c) => (
            <li key={c.courseTitle + c.issuedAt} dir="auto">{c.courseTitle} · {formatDate(c.issuedAt)}</li>
          ))}
        </ul>
      </Card>

      <p className="text-xs text-slate-500">Generated {formatDate(data.generatedAt)}. This page does not show payments or contact details.</p>
    </div>
  );
}
