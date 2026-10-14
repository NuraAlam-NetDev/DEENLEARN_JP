import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../services/api.js';
import { deleteCourse, setCoursePublished } from '../../services/teacherService.js';
import Alert from '../../components/Alert.jsx';
import CourseStats from '../../components/CourseStats.jsx';
import LessonManager from '../../components/LessonManager.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button, { ButtonLink } from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';

// /teacher/courses/:id  -> one course: publish toggle, stats, lesson manager
export default function CourseManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const course = useFetch(`/teacher/courses/${id}`);
  const lessons = useFetch(`/teacher/courses/${id}/lessons?limit=500`);
  const stats = useFetch(`/teacher/courses/${id}/stats`);
  const [publishing, setPublishing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (course.loading && !course.data) return <Spinner />;
  if (course.error) {
    return (
      <div className="space-y-3">
        <Alert>{course.error}</Alert>
        <Link to="/teacher/courses" className="text-brand-700 underline">
          Back to my courses
        </Link>
      </div>
    );
  }
  if (!course.data) return null;

  const c = course.data.course;

  async function togglePublish() {
    setPublishing(true);
    try {
      await setCoursePublished(c._id, !c.published);
      toast.success(c.published ? 'Course unpublished' : 'Course published');
      course.reload();
    } catch (err) {
      toast.error(getErrorMessage(err)); // e.g. "Add at least one lesson before publishing"
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteCourse(c._id);
      toast.success('Course deleted');
      navigate('/teacher/courses', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/teacher/courses" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <Icon name="chevron-left" className="h-4 w-4" />
        My courses
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-3xl font-bold text-brand-800" dir="auto">
              {c.title}
            </h1>
            <Badge tone={c.published ? 'green' : 'gray'}>{c.published ? 'Published' : 'Draft'}</Badge>
          </div>
          <p className="mt-1 text-sm capitalize text-slate-500">{c.category}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/teacher/courses/${c._id}/edit`} variant="outline">
            <Icon name="edit" className="h-4 w-4" />
            Edit details
          </ButtonLink>
          <Button variant={c.published ? 'outline' : 'gold'} loading={publishing} onClick={togglePublish}>
            {c.published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(true)} aria-label="Delete course">
            <Icon name="trash" className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </header>

      <section aria-labelledby="stats-heading" className="space-y-3">
        <h2 id="stats-heading" className="text-2xl font-bold text-brand-800">
          Overview
        </h2>
        <CourseStats stats={stats.data?.stats} loading={stats.loading} error={stats.error} />
      </section>

      <section aria-labelledby="lessons-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="lessons-heading" className="text-2xl font-bold text-brand-800">
              Lessons
            </h2>
            <p className="text-sm text-slate-500">Drag the handle to change the order.</p>
          </div>
          <ButtonLink to={`/teacher/courses/${c._id}/lessons/new`}>
            <Icon name="plus" className="h-4 w-4" />
            Add lesson
          </ButtonLink>
        </div>

        {lessons.error && <Alert>{lessons.error}</Alert>}
        {lessons.loading && !lessons.data && <Spinner />}
        {lessons.data && (
          <LessonManager
            courseId={c._id}
            initialLessons={lessons.data.lessons}
            onChanged={stats.reload}
          />
        )}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this course?"
        message="The course, all its lessons, files, enrollments and student progress will be deleted. This cannot be undone."
        confirmLabel="Delete course"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
