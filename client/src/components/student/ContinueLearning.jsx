import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';

// The big "pick up where you left off" card on the dashboard.
export default function ContinueLearning({ target }) {
  const { t } = useTranslation();
  const pct = Math.max(0, Math.min(100, Math.round(target.progress)));

  return (
    <section
      aria-labelledby="continue-heading"
      className="pattern-star overflow-hidden rounded-2xl bg-brand-800 p-5 text-white shadow-card sm:p-7"
    >
      <p id="continue-heading" className="text-sm font-semibold uppercase tracking-wide text-gold-400">
        {t('student.continue.label')}
      </p>
      <h2 className="mt-1 break-words text-2xl font-bold sm:text-3xl" dir="auto">
        {target.courseTitle}
      </h2>
      <p className="mt-1 text-brand-100">
        {t('student.continue.nextLesson', { lesson: target.lessonTitle })}
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-xs sm:flex-1">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('student.continue.progressLabel')}
          >
            <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-brand-100">{t('student.continue.pctComplete', { pct })}</p>
        </div>

        <ButtonLink
          to={`/student/courses/${target.courseId}/lessons/${target.lessonId}`}
          variant="gold"
          size="lg"
        >
          {t('student.continue.button')}
          <Icon name="arrow-right" className="h-5 w-5" />
        </ButtonLink>
      </div>
    </section>
  );
}