import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

const input = 'w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm';

// One message to all students, or to the students of one course. Each email is written to the Email log.
export default function BulkEmail() {
  const toast = useToast();
  const courses = useFetch('/admin/courses?limit=100');
  const [audience, setAudience] = useState('students');
  const [courseId, setCourseId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(e) {
    e.preventDefault();
    const who = audience === 'students' ? 'every active student' : 'every student of the chosen course';
    if (!window.confirm(`Send this email to ${who}? It cannot be recalled.`)) return;
    setBusy(true);
    try {
      const { data } = await api.post('/admin/bulk-email', { audience, courseId: courseId || undefined, subject, body });
      toast.success(`Sending to ${data.recipients} students in the background. Check the Email log.`);
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Bulk email</h1>
        <p className="mt-1 text-slate-600">Write once, send to many. Up to 2000 students per send.</p>
      </div>
      <Card className="p-5">
        <form onSubmit={send} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Send to</span>
            <select className={input} value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="students">All active students</option>
              <option value="course">Students of one course</option>
            </select>
          </label>
          {audience === 'course' && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Course</span>
              <select className={input} value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                <option value="">Choose a course</option>
                {(courses.data?.courses ?? []).map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Subject</span>
            <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Message</span>
            <textarea className={input} rows={8} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} required />
          </label>
          <div className="text-end">
            <Button type="submit" loading={busy}>Send email</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
