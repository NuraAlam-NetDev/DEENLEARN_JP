import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

const input = 'h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600';
const EMPTY = { courseId: '', title: '', startsAt: '', durationMin: '60', joinUrl: '' };

// Schedule a live class for one of your courses. Students get a notice, and the join link opens 10 minutes before.
export default function TeacherLiveClasses() {
  const toast = useToast();
  const courses = useFetch('/teacher/courses?limit=50');
  const classes = useFetch('/teacher/live-classes');
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/teacher/live-classes', {
        courseId: form.courseId,
        title: form.title.trim(),
        startsAt: new Date(form.startsAt).toISOString(),
        durationMin: Number(form.durationMin),
        joinUrl: form.joinUrl.trim(),
      });
      toast.success('Live class scheduled. Students have been told.');
      setForm(EMPTY);
      classes.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (!window.confirm('Delete this live class?')) return;
    try {
      await api.delete(`/teacher/live-classes/${c._id}`);
      classes.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Live classes</h1>
        <p className="mt-1 text-slate-600">Paste a Zoom or Google Meet link. Only https links are accepted.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
          <select className={input} value={form.courseId} onChange={set('courseId')} required>
            <option value="">Choose a course</option>
            {(courses.data?.courses ?? []).map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <input className={input} placeholder="Title (e.g. Tajweed revision)" value={form.title} onChange={set('title')} required />
          <input className={input} type="datetime-local" value={form.startsAt} onChange={set('startsAt')} required />
          <input className={input} type="number" min="5" max="300" value={form.durationMin} onChange={set('durationMin')} aria-label="Duration in minutes" />
          <input className={`${input} sm:col-span-2`} type="url" placeholder="https://zoom.us/... or https://meet.google.com/..." value={form.joinUrl} onChange={set('joinUrl')} dir="ltr" required />
          <div className="sm:col-span-2 sm:text-end">
            <Button type="submit" loading={busy}>Schedule class</Button>
          </div>
        </form>
      </Card>

      <ul className="space-y-3">
        {classes.data?.classes.map((c) => (
          <li key={c._id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-slate-800" dir="auto">{c.title}</p>
                <p className="text-sm text-slate-600" dir="auto">{c.course?.title} · {formatDateTime(c.startsAt)} · {c.durationMin} min · {c.status}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => remove(c)}>Delete</Button>
            </Card>
          </li>
        ))}
        {classes.data && classes.data.classes.length === 0 && <p className="text-sm text-slate-500">No classes yet.</p>}
      </ul>
    </div>
  );
}
