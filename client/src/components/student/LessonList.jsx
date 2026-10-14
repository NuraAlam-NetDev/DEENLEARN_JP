import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../ui/Icon.jsx';

// Sidebar of the lesson reader: every lesson of the course, with done / bookmarked marks.
export default function LessonList({ courseId, lessons, currentId }) {
  const { t } = useTranslation();
  const currentRef = useRef(null);

  // keep the lesson you are reading visible inside a long list
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentId, lessons.length]);

  return (
    <ol className="divide-y divide-brand-50">
      {lessons.map((lesson, i) => {
        const current = lesson._id === currentId;
        return (
          <li key={lesson._id}>
            <Link
              ref={current ? currentRef : undefined}
              to={`/student/courses/${courseId}/lessons/${lesson._id}`}
              aria-current={current ? 'page' : undefined}
              className={`flex items-center gap-3 border-s-4 px-4 py-3 text-sm transition-colors ${
                current
                  ? 'border-gold-500 bg-brand-50 font-semibold text-brand-900'
                  : 'border-transparent text-slate-700 hover:bg-brand-50/60'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                {lesson.completed ? (
                  <Icon name="check" className="h-6 w-6 text-brand-600" />
                ) : (
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                      current ? 'border-brand-600 text-brand-700' : 'border-brand-200 text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1 break-words" dir="auto">
                {lesson.title}
                {lesson.completed && <span className="sr-only"> {t('reader.list.completedSr')}</span>}
              </span>
              {lesson.bookmarked && (
                <>
                  <Icon name="bookmark" filled className="h-4 w-4 shrink-0 text-gold-600" />
                  <span className="sr-only">{t('reader.list.bookmarkedSr')}</span>
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}