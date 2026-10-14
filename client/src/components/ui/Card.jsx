import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProgressBar from './ProgressBar.jsx';
import Icon from './Icon.jsx';

export function Card({ as: Tag = 'div', interactive = false, className = '', ...props }) {
  const hover = interactive
    ? 'transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-lg'
    : '';
  return (
    <Tag
      className={`rounded-xl border border-brand-100 bg-white shadow-card ${hover} ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-brand-50 px-5 py-4">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold text-brand-800">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className = '', ...props }) {
  return <div className={`p-5 ${className}`} {...props} />;
}

export function StatCard({ label, value, hint, tone = 'default' }) {
  const toneClass = tone === 'warning' ? 'border-gold-300 bg-gold-50' : '';
  return (
    <Card className={`p-4 ${toneClass}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-brand-800">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

export function CourseCard({
  title,
  teacher,
  category,
  lessonCount,
  completedLessons,
  studentCount,
  progress,
  thumbnail,
  to,
  badge,
}) {
  const { t } = useTranslation();

  const heading = to ? (
    <Link to={to} className="after:absolute after:inset-0 hover:text-brand-600">
      {title}
    </Link>
  ) : (
    title
  );

  const meta = [];
  if (teacher) meta.push(<span key="t" dir="auto">{teacher}</span>);
  if (lessonCount != null) {
    meta.push(
      completedLessons != null
        ? t('card.lessonsDone', { done: completedLessons, count: lessonCount })
        : t('card.lessonsCount', { count: lessonCount })
    );
  }
  if (studentCount) meta.push(t('card.learners', { count: studentCount }));

  return (
    <Card interactive className="relative flex flex-col overflow-hidden">
      <div className="pattern-star relative aspect-video bg-brand-700">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-gold-400">
            <Icon name="book" className="h-10 w-10" />
          </div>
        )}
        {category && (
          <span className="absolute start-3 top-3 rounded-full bg-gold-500 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand-950">
            {category}
          </span>
        )}
        {badge && <span className="absolute end-3 top-3">{badge}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="break-words font-display text-xl font-bold text-brand-800" dir="auto">
          {heading}
        </h3>
        <p className="text-sm text-slate-500">
          {meta.map((m, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              {m}
            </span>
          ))}
        </p>
        {progress != null && <ProgressBar value={progress} className="mt-auto pt-2" />}
      </div>
    </Card>
  );
}