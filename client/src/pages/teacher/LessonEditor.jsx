import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { useForm } from '../../hooks/useForm.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import {
  createLesson,
  deleteAttachment,
  updateLesson,
  uploadAttachment,
} from '../../services/teacherService.js';
import { formatBytes } from '../../utils/format.js';
import { toHtml } from '../../utils/richText.js';
import Alert from '../../components/Alert.jsx';
import FileUploader from '../../components/FileUploader.jsx';
import { LANGUAGES } from '../../i18n/index.js';
import FormField from '../../components/FormField.jsx';
import RichTextEditor from '../../components/RichTextEditor.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import Icon from '../../components/ui/Icon.jsx';

const MAX_ATTACHMENTS = 20; // same as the server

// Same rules as the server (server/src/validators/lesson.js)
function validateLesson({ title, videoUrl }) {
  const errors = {};
  const t = title.trim();
  if (!t) errors.title = 'Title is required';
  else if (t.length > 150) errors.title = 'Title must be at most 150 characters';

  const v = videoUrl.trim();
  if (v && !/^https?:\/\/\S+$/i.test(v)) errors.videoUrl = 'Enter a link starting with http:// or https://';
  return errors;
}

function AttachmentRow({ attachment, onRemove, removing }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-brand-100 bg-white p-3">
      <div className="flex items-center gap-3">
        {attachment.kind === 'image' ? (
          <img src={attachment.url} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" loading="lazy" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <Icon name="file" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            dir="auto"
            className="block truncate font-medium text-brand-800 hover:underline"
          >
            {attachment.name}
          </a>
          <p className="text-xs uppercase text-slate-500">
            {attachment.kind} · {(attachment.language || 'en').toUpperCase()} · {formatBytes(attachment.size)}
          </p>
        </div>
        <Button variant="ghost" size="sm" loading={removing} onClick={() => onRemove(attachment)} aria-label={`Remove ${attachment.name}`}>
          <Icon name="trash" className="h-4 w-4 text-red-600" />
        </Button>
      </div>
      {attachment.kind === 'audio' && <audio controls preload="none" src={attachment.url} className="w-full" />}
    </li>
  );
}

function Attachments({ lesson }) {
  const toast = useToast();
  const [files, setFiles] = useState(lesson.attachments ?? []);
  const [removingId, setRemovingId] = useState(null);
  const [uploadLang, setUploadLang] = useState('en'); // language the next file is saved in

  async function handleUpload(file, options) {
    const { attachment } = await uploadAttachment(lesson._id, file, { ...options, fields: { language: uploadLang } });
    setFiles((list) => [...list, attachment]);
    toast.success(`Uploaded ${attachment.name}`);
  }

  async function handleRemove(attachment) {
    setRemovingId(attachment._id);
    try {
      await deleteAttachment(lesson._id, attachment._id);
      setFiles((list) => list.filter((f) => f._id !== attachment._id));
      toast.success('File removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  }

  const full = files.length >= MAX_ATTACHMENTS;

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-brand-800">Files</h2>
        <span className="text-xs text-slate-500">
          {files.length} / {MAX_ATTACHMENTS}
        </span>
      </div>
      <p className="text-sm text-slate-500">PDFs, images and audio (MP3, WAV, OGG, M4A). Files are saved as soon as they upload.</p>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((a) => (
            <AttachmentRow key={a._id} attachment={a} onRemove={handleRemove} removing={removingId === a._id} />
          ))}
        </ul>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Language of this file</span>
        <select
          value={uploadLang}
          onChange={(e) => setUploadLang(e.target.value)}
          className="h-10 max-w-xs rounded-lg border border-brand-200 bg-white px-3 text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">Students pick this language when they open the PDF.</span>
      </label>

      {full ? (
        <Alert type="info">This lesson has the maximum number of files. Remove one to add another.</Alert>
      ) : (
        <FileUploader onUpload={handleUpload} />
      )}
    </Card>
  );
}

function LessonForm({ courseId, lesson }) {
  const toast = useToast();
  const navigate = useNavigate();
  const editing = !!lesson;
  const startContent = toHtml(lesson?.content ?? ''); // old plain-text lessons become paragraphs
  const [content, setContent] = useState(startContent);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { values, errors, onChange, onBlur, handleSubmit, setServerErrors } = useForm({
    initialValues: { title: lesson?.title ?? '', videoUrl: lesson?.videoUrl ?? '' },
    validate: validateLesson,
  });

  // browser's own "leave this page?" prompt while there are unsaved edits
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function submit(v) {
    setFormError('');
    setSaving(true);
    const body = { title: v.title.trim(), videoUrl: v.videoUrl.trim(), content };
    try {
      if (editing) {
        await updateLesson(lesson._id, body);
        setDirty(false);
        toast.success('Lesson saved');
      } else {
        const { lesson: created } = await createLesson(courseId, body);
        setDirty(false);
        toast.success('Lesson created. You can now attach files.');
        // same page in edit mode, so the file uploader becomes available
        navigate(`/teacher/courses/${courseId}/lessons/${created._id}`, { replace: true });
      }
    } catch (err) {
      const fields = getFieldErrors(err);
      if (Object.keys(fields).length) setServerErrors(fields);
      else setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <form
          onSubmit={handleSubmit(submit)}
          onChange={() => setDirty(true)}
          noValidate
          className="space-y-4"
        >
          {formError && <Alert>{formError}</Alert>}

          <FormField
            label="Lesson title"
            name="title"
            value={values.title}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.title}
            maxLength={150}
            autoFocus={!editing}
          />

          <FormField
            label="Video link (optional)"
            name="videoUrl"
            type="url"
            value={values.videoUrl}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.videoUrl}
            placeholder="https://"
          />

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Content</span>
            <RichTextEditor
              value={startContent}
              onChange={(html) => {
                setContent(html);
                setDirty(true);
              }}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            {dirty && <span className="text-sm text-slate-500 sm:me-auto">Unsaved changes</span>}
            <Link
              to={`/teacher/courses/${courseId}`}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-700 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:h-10 sm:text-base"
            >
              {editing ? 'Back to course' : 'Cancel'}
            </Link>
            <Button type="submit" loading={saving}>
              {editing ? 'Save lesson' : 'Create lesson'}
            </Button>
          </div>
        </form>
      </Card>

      {editing ? (
        <Attachments lesson={lesson} />
      ) : (
        <Alert type="info">Save the lesson first, then you can attach PDFs, images and audio to it.</Alert>
      )}
    </div>
  );
}

// /teacher/courses/:courseId/lessons/new  and  /teacher/courses/:courseId/lessons/:lessonId
export default function LessonEditor() {
  const { courseId, lessonId } = useParams();
  const { data, loading, error } = useFetch(lessonId ? `/teacher/lessons/${lessonId}` : null);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to={`/teacher/courses/${courseId}`} className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <Icon name="chevron-left" className="h-4 w-4" />
        Back to course
      </Link>
      <h1 className="text-3xl font-bold text-brand-800">{lessonId ? 'Edit lesson' : 'New lesson'}</h1>

      {loading && <Spinner />}
      {error && <Alert>{error}</Alert>}
      {!lessonId && <LessonForm key="new" courseId={courseId} />}
      {lessonId && data && <LessonForm key={data.lesson._id} courseId={courseId} lesson={data.lesson} />}
    </div>
  );
}
