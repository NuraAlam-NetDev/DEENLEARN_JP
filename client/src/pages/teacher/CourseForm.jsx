import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/index.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useForm } from '../../hooks/useForm.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import {
  createCourse,
  deleteThumbnail,
  updateCourse,
  uploadThumbnail,
} from '../../services/teacherService.js';
import Alert from '../../components/Alert.jsx';
import FileUploader from '../../components/FileUploader.jsx';
import FormField from '../../components/FormField.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import TextAreaField from '../../components/ui/TextAreaField.jsx';
import { Spinner } from '../../components/Spinner.jsx';

const CATEGORIES = ['quran', 'hadith', 'fiqh', 'aqeedah', 'seerah', 'arabic', 'general'];
const WHOLE_NUMBER = /^\d+$/;

// Same limits as the server (server/src/validators/course.js). Messages follow the selected language.
function validateCourse({ title, category, description, priceJPY, priceUSD }) {
  const t = (key) => i18n.t(key);
  const errors = {};
  const name = title.trim();
  if (!name) errors.title = t('teacher.form.titleRequired');
  else if (name.length < 3) errors.title = t('teacher.form.titleShort');
  else if (name.length > 150) errors.title = t('teacher.form.titleLong');

  if (!category.trim()) errors.category = t('teacher.form.categoryRequired');
  else if (category.trim().length > 50) errors.category = t('teacher.form.categoryLong');

  if (description.trim().length > 5000) errors.description = t('teacher.form.descriptionLong');

  if (!WHOLE_NUMBER.test(String(priceJPY).trim())) errors.priceJPY = t('coursePrice.invalid');
  else if (Number(priceJPY) > 1000000) errors.priceJPY = t('coursePrice.tooHighJPY');
  if (!WHOLE_NUMBER.test(String(priceUSD).trim())) errors.priceUSD = t('coursePrice.invalid');
  else if (Number(priceUSD) > 10000) errors.priceUSD = t('coursePrice.tooHighUSD');
  return errors;
}

// Cover image: saved immediately (it is its own request), so it lives outside the main form.
function CoverImage({ courseId, initialUrl }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [url, setUrl] = useState(initialUrl);
  const [removing, setRemoving] = useState(false);

  async function handleUpload(file, options) {
    const { course } = await uploadThumbnail(courseId, file, options);
    setUrl(course.thumbnail);
    toast.success(t('teacher.form.coverUpdated'));
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await deleteThumbnail(courseId);
      setUrl('');
      toast.success(t('teacher.form.coverRemoved'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-display text-xl font-bold text-brand-800">{t('teacher.form.coverTitle')}</h2>
      {url && (
        <div className="flex items-center gap-3">
          <img src={url} alt={t('teacher.form.currentCover')} className="aspect-video w-40 rounded-lg object-cover" />
          <Button variant="outline" size="sm" loading={removing} onClick={handleRemove}>
            {t('teacher.form.remove')}
          </Button>
        </div>
      )}
      <FileUploader
        accept="image/*"
        multiple={false}
        label={url ? t('teacher.form.replaceImage') : t('teacher.form.uploadImage')}
        hint={t('teacher.form.imageHint')}
        onUpload={handleUpload}
      />
    </Card>
  );
}

function CourseFormBody({ course }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const editing = !!course;
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { values, errors, onChange, onBlur, handleSubmit, setServerErrors } = useForm({
    initialValues: {
      title: course?.title ?? '',
      category: course?.category ?? 'general',
      description: course?.description ?? '',
      priceJPY: String(course?.priceJPY ?? 0),
      priceUSD: String(course?.priceUSD ?? 0),
    },
    validate: validateCourse,
  });

  async function submit(v) {
    setFormError('');
    setSaving(true);
    const body = {
      title: v.title.trim(),
      category: v.category.trim(),
      description: v.description.trim(),
      priceJPY: Number(v.priceJPY.trim() || 0),
      priceUSD: Number(v.priceUSD.trim() || 0),
    };
    try {
      if (editing) {
        await updateCourse(course._id, body);
        toast.success(t('teacher.form.saved'));
        navigate(`/teacher/courses/${course._id}`);
      } else {
        const { course: created } = await createCourse(body);
        toast.success(t('teacher.form.created'));
        navigate(`/teacher/courses/${created._id}`);
      }
    } catch (err) {
      const fields = getFieldErrors(err);
      if (Object.keys(fields).length) setServerErrors(fields);
      else setFormError(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {editing && <CoverImage courseId={course._id} initialUrl={course.thumbnail} />}

      <Card className="p-5">
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          {formError && <Alert>{formError}</Alert>}

          <FormField
            label={t('teacher.form.title')}
            name="title"
            value={values.title}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.title}
            maxLength={150}
            autoFocus={!editing}
          />

          <div>
            <label htmlFor="course-category" className="mb-1 block text-sm font-medium text-slate-700">
              {t('teacher.form.category')}
            </label>
            <select
              id="course-category"
              name="category"
              value={values.category}
              onChange={onChange}
              onBlur={onBlur}
              className="h-11 w-full rounded-lg border border-brand-200 bg-white px-3 text-base capitalize outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 sm:h-10 sm:text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
          </div>

          <TextAreaField
            label={t('teacher.form.description')}
            name="description"
            rows={6}
            value={values.description}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.description}
            hint={t('teacher.form.descriptionHint')}
          />

          <fieldset className="space-y-3 rounded-xl border border-brand-100 p-4">
            <legend className="px-1 font-display text-lg font-bold text-brand-800">
              {t('coursePrice.title')}
            </legend>
            <p className="text-sm text-slate-500">{t('coursePrice.hint')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={t('coursePrice.jpyLabel')}
                name="priceJPY"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={values.priceJPY}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.priceJPY}
                hint={t('coursePrice.jpyHint')}
              />
              <FormField
                label={t('coursePrice.usdLabel')}
                name="priceUSD"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={values.priceUSD}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.priceUSD}
                hint={t('coursePrice.usdHint')}
              />
            </div>
            <p className="text-xs text-slate-500">{t('coursePrice.note')}</p>
          </fieldset>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              to={editing ? `/teacher/courses/${course._id}` : '/teacher/courses'}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-700 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:h-10 sm:text-base"
            >
              {t('teacher.form.cancel')}
            </Link>
            <Button type="submit" loading={saving}>
              {editing ? t('teacher.form.save') : t('teacher.form.create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// /teacher/courses/new  and  /teacher/courses/:id/edit
export default function CourseForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data, loading, error } = useFetch(id ? `/teacher/courses/${id}` : null);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-brand-800">
        {id ? t('teacher.form.editTitle') : t('teacher.form.newTitle')}
      </h1>
      {loading && <Spinner />}
      {error && <Alert>{error}</Alert>}
      {!id && <CourseFormBody />}
      {id && data && <CourseFormBody course={data.course} />}
    </div>
  );
}
