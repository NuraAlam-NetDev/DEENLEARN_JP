import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import Alert from '../../components/Alert.jsx';
import Discussion from '../../components/Discussion.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Icon from '../../components/ui/Icon.jsx';

// /teacher/courses/:courseId/lessons/:lessonId/discussion  -> answer students' questions
export default function LessonDiscussion() {
  const { courseId, lessonId } = useParams();
  const lesson = useFetch(`/teacher/lessons/${lessonId}`);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to={`/teacher/courses/${courseId}`} className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to course
      </Link>
      <h1 className="text-3xl font-bold text-brand-800">Questions &amp; answers</h1>
      {lesson.loading && <Spinner />}
      {lesson.error && <Alert>{lesson.error}</Alert>}
      {lesson.data && (
        <>
          <p className="text-slate-600" dir="auto">Lesson: <span className="font-semibold">{lesson.data.lesson.title}</span></p>
          <Discussion lessonId={lessonId} />
        </>
      )}
    </div>
  );
}
