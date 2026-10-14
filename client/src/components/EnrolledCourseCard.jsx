import { Link } from 'react-router-dom';
import { learnTarget } from '../utils/learning.js';
import { ButtonLink } from './ui/Button.jsx';
import { Card } from './ui/Card.jsx';
import Icon from './ui/Icon.jsx';
import ProgressBar from './ui/ProgressBar.jsx';

// One enrolled course: cover, title, progress bar and the Continue button.
export default function EnrolledCourseCard({ enrollment }) {
  const { course, progress, completedLessons, totalLessons } = enrollment;
  const target = learnTarget(enrollment);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="pattern-star relative aspect-video bg-brand-700">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-gold-400">
            <Icon name="book" className="h-10 w-10" />
          </div>
        )}
        {course.category && (
          <span className="absolute start-3 top-3 rounded-full bg-gold-500 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand-950">
            {course.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="break-words font-display text-xl font-bold text-brand-800" dir="auto">
          <Link to={target?.to ?? `/courses/${course._id}`} className="hover:text-brand-600">
            {course.title}
          </Link>
        </h3>
        {course.teacher?.name && (
          <p className="text-sm text-slate-500" dir="auto">
            {course.teacher.name}
          </p>
        )}

        <div className="mt-auto pt-2">
          <ProgressBar value={progress} label={`Progress in ${course.title}`} />
          <p className="mt-1 text-xs text-slate-500">
            {completedLessons} of {totalLessons} lesson{totalLessons === 1 ? '' : 's'} done
          </p>
        </div>

        {target ? (
          <ButtonLink to={target.to} variant={progress >= 100 ? 'outline' : 'primary'} full>
            {target.label}
          </ButtonLink>
        ) : (
          <p className="text-center text-sm text-slate-500">No lessons yet. Check back soon.</p>
        )}
      </div>
    </Card>
  );
}
