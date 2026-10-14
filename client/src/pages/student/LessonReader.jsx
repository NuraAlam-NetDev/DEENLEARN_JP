import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../services/api.js';
import { setLessonBookmark, setLessonComplete } from '../../services/studentService.js';
import Alert from '../../components/Alert.jsx';
import LessonContent from '../../components/student/LessonContent.jsx';
import LessonList from '../../components/student/LessonList.jsx';
import StudyTabs from '../../components/student/StudyTabs.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button, { ButtonLink } from '../../components/ui/Button.jsx';
import { Card, CardBody } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Icon from '../../components/ui/Icon.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { calcPercent } from '../../utils/progress.js';

// Previous / next link with the lesson title underneath
function NavCard({ to, direction, title, primary = false }) {
  const { t } = useTranslation();
  const tone = primary
    ? 'border-brand-700 bg-brand-700 text-white hover:bg-brand-800'
    : 'border-brand-200 text-brand-800 hover:bg-brand-50';
  const isPrev = direction === 'prev';

  return (
    <Link
      to={to}
      aria-label={isPrev ? t('reader.nav.prevAria', { title }) : t('reader.nav.nextAria', { title })}
      className={`flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 transition-colors sm:max-w-xs ${tone}`}
    >
      {isPrev && <Icon name="chevron-left" className="h-5 w-5 shrink-0" />}
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-xs opacity-80">{isPrev ? t('reader.nav.prev') : t('reader.nav.next')}</span>
        <span className="block truncate text-sm font-semibold" dir="auto">
          {title}
        </span>
      </span>
      {!isPrev && <Icon name="chevron-right" className="h-5 w-5 shrink-0" />}
    </Link>
  );
}

// One lesson. The reader renders it with key={lessonId}, so every lesson starts with fresh state.
function LessonPane({ courseId, lessonId, position, total, onChanged }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, error, status } = useFetch(`/lessons/${lessonId}`);
  const [local, setLocal] = useState({}); // what the student just changed, shown at once
  const [busy, setBusy] = useState(''); // 'complete' | 'bookmark' | ''
  const quiz = useFetch(`/lessons/${lessonId}/quiz`); // { quiz: null } when the lesson has no quiz
  // ?tab=notes|quiz|discussion opens that tab (the "My notes" page links here)
  const [params] = useSearchParams();
  const [tab, setTab] = useState(() => params.get('tab'));
  const studyRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (loading && !data) {
    return (
      <Card>
        <CardBody className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-48 w-full" />
        </CardBody>
      </Card>
    );
  }

  if (status === 404) {
    return (
      <EmptyState
        title={t('reader.lesson.notFoundTitle')}
        text={t('reader.lesson.notFoundText')}
        action={<ButtonLink to="/student/courses">{t('reader.nav.back')}</ButtonLink>}
      />
    );
  }

  if (status === 403) {
    return (
      <EmptyState
        title={t('reader.lesson.enrollTitle')}
        text={t('reader.lesson.enrollText')}
        action={<ButtonLink to={`/courses/${courseId}`}>{t('reader.lesson.viewCourse')}</ButtonLink>}
      />
    );
  }

  if (error || !data) return <Alert>{error || t('reader.lesson.loadError')}</Alert>;

  const { lesson, prevLesson, nextLesson } = data;

  // a link with the wrong course in it: go to the right address
  if (String(lesson.course) !== courseId) {
    return <Navigate replace to={`/student/courses/${lesson.course}/lessons/${lessonId}`} />;
  }

  const completed = local.completed ?? data.completed;
  const bookmarked = local.bookmarked ?? data.bookmarked;
  const base = `/student/courses/${courseId}/lessons`;
  // A required quiz must be passed before the lesson can be completed (the server enforces it too)
  const quizBlocks = !completed && !!quiz.data?.quiz?.required && !quiz.data.summary.passed;

  function openQuiz() {
    setTab('quiz');
    setTimeout(() => studyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  async function toggleComplete() {
    const next = !completed;
    setBusy('complete');
    try {
      const res = await setLessonComplete(lessonId, next);
      setLocal((l) => ({ ...l, completed: next }));
      onChanged();
      if (next && res.courseCompleted) toast.success(t('reader.lesson.courseDone'));
      else if (next) toast.success(t('reader.lesson.lessonDone'));
      else toast.info(t('reader.lesson.lessonUndone'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function toggleBookmark() {
    const next = !bookmarked;
    setBusy('bookmark');
    try {
      await setLessonBookmark(lessonId, next);
      setLocal((l) => ({ ...l, bookmarked: next }));
      onChanged();
      toast.info(next ? t('reader.lesson.bookmarked') : t('reader.lesson.bookmarkRemoved'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <Card>
        <CardBody className="sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            {position >= 0 && (
              <p className="text-sm text-slate-500">
                {t('reader.lesson.position', { n: position + 1, total })}
              </p>
            )}
            {completed && <Badge tone="green">{t('reader.lesson.completed')}</Badge>}
          </div>

          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="min-w-0 break-words text-2xl font-bold text-brand-800 sm:text-3xl" dir="auto">
              {lesson.title}
            </h1>
            <button
              type="button"
              onClick={toggleBookmark}
              disabled={busy === 'bookmark'}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? t('reader.lesson.bookmarkRemove') : t('reader.lesson.bookmarkAdd')}
              title={bookmarked ? t('reader.lesson.bookmarkRemove') : t('reader.lesson.bookmarkAdd')}
              className={`shrink-0 rounded-lg border p-2.5 transition-colors disabled:opacity-60 ${
                bookmarked
                  ? 'border-gold-400 bg-gold-50 text-gold-700 hover:bg-gold-100'
                  : 'border-brand-200 text-brand-700 hover:bg-brand-50'
              }`}
            >
              <Icon name="bookmark" filled={bookmarked} className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6">
            <LessonContent lesson={lesson} />
          </div>
        </CardBody>

        <div className="grid gap-3 border-t border-brand-100 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-5">
          <div className="order-2 sm:order-1">
            {prevLesson && (
              <NavCard to={`${base}/${prevLesson._id}`} direction="prev" title={prevLesson.title} />
            )}
          </div>

          <Button
            variant={completed ? 'outline' : 'primary'}
            onClick={toggleComplete}
            loading={busy === 'complete'}
            disabled={quizBlocks}
            aria-pressed={completed}
            title={
              completed
                ? t('reader.lesson.undoTitle')
                : quizBlocks
                  ? t('reader.lesson.passQuizFirst')
                  : undefined
            }
            className="order-1 sm:order-2"
          >
            <Icon name="check" className="h-5 w-5" />
            {completed ? t('reader.lesson.undo') : t('reader.lesson.complete')}
          </Button>

          <div className="order-3 sm:justify-self-end">
            {nextLesson ? (
              <NavCard to={`${base}/${nextLesson._id}`} direction="next" title={nextLesson.title} primary={completed} />
            ) : (
              <ButtonLink to="/student/courses" variant={completed ? 'primary' : 'outline'} full>
                {t('reader.nav.back')}
              </ButtonLink>
            )}
          </div>
        </div>

        {quizBlocks && (
          <div className="border-t border-brand-100 p-4 sm:px-5">
            <Alert type="info">
              {t('reader.lesson.quizRequired')}{' '}
              <button type="button" onClick={openQuiz} className="font-semibold underline">
                {t('reader.lesson.openQuiz')}
              </button>
            </Alert>
          </div>
        )}
      </Card>

      <div ref={studyRef} className="scroll-mt-20">
        <StudyTabs lessonId={lessonId} quiz={quiz} active={tab} onChange={setTab} onQuizAttempted={quiz.reload} />
      </div>
    </>
  );
}

// /student/courses/:courseId/lessons/:lessonId
export default function LessonReader() {
  const { t } = useTranslation();
  const { courseId, lessonId } = useParams();
  const outline = useFetch(`/courses/${courseId}/lessons`);
  const [listOpen, setListOpen] = useState(false);

  // phones: fold the lesson list away after choosing a lesson
  useEffect(() => {
    setListOpen(false);
  }, [lessonId]);

  const { data, loading, error, status, reload } = outline;

  if (loading && !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (status === 403) {
    return (
      <EmptyState
        title={t('reader.course.enrollTitle')}
        text={t('reader.course.enrollText')}
        action={<ButtonLink to={`/courses/${courseId}`}>{t('reader.lesson.viewCourse')}</ButtonLink>}
      />
    );
  }

  if (status === 404) {
    return (
      <EmptyState
        title={t('reader.course.notFoundTitle')}
        text={t('reader.course.notFoundText')}
        action={<ButtonLink to="/student/courses">{t('reader.nav.back')}</ButtonLink>}
      />
    );
  }

  if (error || !data) return <Alert>{error || t('reader.course.loadError')}</Alert>;

  const { course, lessons } = data;
  const done = lessons.filter((l) => l.completed).length;
  const progress = calcPercent(done, lessons.length);
  const position = lessons.findIndex((l) => l._id === lessonId);

  return (
    <div>
      <nav aria-label={t('reader.nav.breadcrumb')} className="mb-4 flex min-w-0 items-center gap-1 text-sm">
        <Link to="/student/courses" className="shrink-0 font-medium text-brand-700 hover:text-brand-600">
          {t('reader.nav.myCourses')}
        </Link>
        <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate text-slate-600" dir="auto">
          {course.title}
        </span>
      </nav>

      {lessons.length > 0 && progress === 100 && (
        <div className="mb-4">
          <Alert type="success">
            {t('reader.course.finished')}{' '}
            <Link to="/student/certificates" className="font-semibold underline">
              {t('reader.course.getCertificate')}
            </Link>
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <button
            type="button"
            onClick={() => setListOpen((v) => !v)}
            aria-expanded={listOpen}
            aria-controls="lesson-list"
            className="flex w-full items-center gap-2 rounded-xl border border-brand-100 bg-white px-4 py-3 text-start font-semibold text-brand-800 shadow-card lg:hidden"
          >
            <Icon name="list" className="h-5 w-5" />
            <span className="flex-1">{t('reader.course.lessonsHeading')}</span>
            <span className="text-sm font-normal text-slate-500">
              {t('reader.course.doneShort', { done, total: lessons.length })}
            </span>
          </button>

          <div id="lesson-list" className={`${listOpen ? 'mt-2 block' : 'hidden'} lg:mt-0 lg:block`}>
            <Card className="overflow-hidden">
              <div className="border-b border-brand-50 p-4">
                <h2 className="break-words text-lg font-bold text-brand-800" dir="auto">
                  {course.title}
                </h2>
                <ProgressBar value={progress} label={t('reader.course.progressLabel')} className="mt-2" />
                <p className="mt-0.5 text-xs text-slate-500">
                  {t('reader.course.done', { done, total: lessons.length, count: lessons.length })}
                </p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto lg:max-h-[calc(100dvh-16rem)]">
                {lessons.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">{t('reader.course.noLessons')}</p>
                ) : (
                  <LessonList courseId={courseId} lessons={lessons} currentId={lessonId} />
                )}
              </div>
            </Card>
          </div>
        </aside>

        <article className="min-w-0" aria-label={t('reader.course.article')}>
          <LessonPane
            key={lessonId}
            courseId={courseId}
            lessonId={lessonId}
            position={position}
            total={lessons.length}
            onChanged={reload}
          />
        </article>
      </div>
    </div>
  );
}