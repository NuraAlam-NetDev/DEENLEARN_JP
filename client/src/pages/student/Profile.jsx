import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useForm } from '../../hooks/useForm.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { changePassword, updateProfile } from '../../services/studentService.js';
import { formatDate } from '../../utils/format.js';
import { validatePasswordChange, validateProfile } from '../../utils/validators.js';
import Alert from '../../components/Alert.jsx';
import AvatarPicker from '../../components/AvatarPicker.jsx';
import ContactDetails from '../../components/ContactDetails.jsx';
import FormField from '../../components/FormField.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card, CardBody, CardHeader, StatCard } from '../../components/ui/Card.jsx';

function NameForm() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { values, errors, onChange, onBlur, handleSubmit, setServerErrors } = useForm({
    initialValues: { name: user.name },
    validate: validateProfile,
  });

  const unchanged = values.name.trim() === user.name;

  const onSubmit = handleSubmit(async (data) => {
    setFormError('');
    setSaving(true);
    try {
      const res = await updateProfile({ name: data.name.trim() });
      updateUser(res.user);
      toast.success(t('student.profile.nameUpdated'));
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setServerErrors(fieldErrors);
      else setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  });

  return (
    <Card>
      <CardHeader title={t('student.profile.detailsTitle')} />
      <CardBody>
        <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <FormField
            label={t('auth.name')}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.name}
          />
          <FormField
            label={t('auth.email')}
            name="email"
            type="email"
            value={user.email}
            readOnly
            hint={t('student.profile.emailHint')}
          />
          <Button type="submit" loading={saving} disabled={unchanged}>
            {saving ? t('student.profile.saving') : t('student.profile.saveChanges')}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function PasswordForm({ onDone }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { values, errors, onChange, onBlur, handleSubmit, setServerErrors } = useForm({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validate: validatePasswordChange,
  });

  const onSubmit = handleSubmit(async (data) => {
    setFormError('');
    setSaving(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success(t('student.profile.passwordChanged'));
      onDone(); // empties the form
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setServerErrors(fieldErrors);
      else if (err.response?.status === 400) setServerErrors({ currentPassword: getErrorMessage(err) });
      else setFormError(getErrorMessage(err)); // e.g. too many attempts
      setSaving(false);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <FormField
        label={t('student.profile.currentPassword')}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={onChange}
        onBlur={onBlur}
        error={errors.currentPassword}
      />
      <FormField
        label={t('student.profile.newPassword')}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint={t('auth.passwordHint')}
        value={values.newPassword}
        onChange={onChange}
        onBlur={onBlur}
        error={errors.newPassword}
      />
      <FormField
        label={t('student.profile.repeatPassword')}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={onChange}
        onBlur={onBlur}
        error={errors.confirmPassword}
      />
      <Button type="submit" loading={saving}>
        {saving ? t('student.profile.changing') : t('student.profile.changePassword')}
      </Button>
    </form>
  );
}

// /student/profile
export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: stats } = useFetch('/enrollments/summary');
  const [passwordFormKey, setPasswordFormKey] = useState(0);
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brand-800">{t('student.profile.title')}</h1>

      <AvatarPicker />
      <ContactDetails />

      <Card>
        <CardBody className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold-500 font-display text-3xl font-bold text-brand-950"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="break-words font-display text-2xl font-bold text-brand-800" dir="auto">
              {user.name}
            </p>
            <p className="ltr-isolate truncate text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Badge tone="green">{t('student.profile.badge')}</Badge>
              {user.createdAt && (
                <span>{t('student.profile.memberSince', { date: formatDate(user.createdAt) })}</span>
              )}
            </p>
          </div>
        </CardBody>
      </Card>

      {stats && stats.enrolledCourses > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t('student.profile.statsEnrolled')} value={stats.enrolledCourses} />
          <StatCard label={t('student.profile.statsCompleted')} value={stats.completedCourses} />
          <StatCard label={t('student.profile.statsLessons')} value={stats.completedLessons} />
          <StatCard label={t('student.profile.statsBookmarks')} value={stats.bookmarks} />
        </div>
      )}

      <NameForm />

      <Card>
        <CardHeader
          title={t('student.profile.passwordTitle')}
          subtitle={t('student.profile.passwordSubtitle')}
        />
        <CardBody>
          <PasswordForm key={passwordFormKey} onDone={() => setPasswordFormKey((k) => k + 1)} />
        </CardBody>
      </Card>
    </div>
  );
}