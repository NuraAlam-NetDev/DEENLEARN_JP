import { Card, StatCard } from './ui/Card.jsx';
import Alert from './Alert.jsx';
import { Skeleton } from './ui/Skeleton.jsx';

// Numbers for one course. `stats` comes from GET /teacher/courses/:id/stats.
export default function CourseStats({ stats, loading, error }) {
  if (error) return <Alert>{error}</Alert>;
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const { students, perLesson } = stats;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Students" value={students} hint={`${stats.newLast7Days} new this week`} />
        <StatCard label="Lessons" value={stats.lessons} />
        <StatCard label="Completed course" value={stats.completed} hint={students ? `of ${students} students` : undefined} />
        <StatCard label="Average progress" value={`${stats.avgProgress}%`} />
      </div>

      {perLesson.length > 0 && students > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 font-display text-lg font-bold text-brand-800">Completions per lesson</h3>
          <ul className="space-y-2">
            {perLesson.map((l, i) => {
              const pct = Math.min(100, Math.round((l.completions / students) * 100));
              return (
                <li key={l._id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-slate-700" dir="auto">
                      {i + 1}. {l.title}
                    </span>
                    <span className="shrink-0 text-slate-500">
                      {l.completions} / {students}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-100" aria-hidden="true">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
