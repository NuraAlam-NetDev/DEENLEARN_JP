import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';
import { useToast } from '../hooks/useToast.js';
import { getErrorMessage, getFieldErrors } from '../services/api.js';
import { validateRegister } from '../utils/validators.js';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';

const roleBox = (active) =>
  `flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
    active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-brand-200 hover:bg-brand-50'
  }`;

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const toast = useToast();
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { values, errors, onChange, onBlur, handleSubmit, setServerErrors } = useForm({
    initialValues: { name: '', email: '', password: '', role: 'student' },
    validate: validateRegister,
  });

  const onSubmit = handleSubmit(async (data) => {
    setFormError('');
    setSubmitting(true);
    try {
      await register({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        role: data.role,
      });
      if (data.role === 'teacher') {
        toast.info(t('auth.teacherWaitingToast'), { title: t('auth.accountCreated') });
      } else {
        toast.success(t('auth.welcomeToast'), { title: t('auth.accountCreated') });
      }
      // GuestRoute redirects automatically once the user is set
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setServerErrors(fieldErrors);
      else setFormError(getErrorMessage(err)); // e.g. email already registered
      setSubmitting(false);
    }
  });

  return (
    <Card className="mx-auto max-w-md">
      <CardBody className="sm:p-8">
        <h1 className="mb-1 text-3xl font-bold text-brand-800">{t('auth.registerTitle')}</h1>
        <p className="mb-5 text-sm text-slate-500">{t('auth.registerSubtitle')}</p>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
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
            autoComplete="email"
            value={values.email}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.email}
          />
          <FormField
            label={t('auth.password')}
            name="password"
            type="password"
            autoComplete="new-password"
            hint={t('auth.passwordHint')}
            value={values.password}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.password}
          />

          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">{t('auth.iWantTo')}</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={roleBox(values.role === 'student')}>
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={values.role === 'student'}
                  onChange={onChange}
                  className="accent-brand-700"
                />
                {t('auth.learn')}
              </label>
              <label className={roleBox(values.role === 'teacher')}>
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={values.role === 'teacher'}
                  onChange={onChange}
                  className="accent-brand-700"
                />
                {t('auth.teach')}
              </label>
            </div>
            {values.role === 'teacher' && (
              <p className="mt-2 text-xs text-gold-800">{t('auth.teacherNote')}</p>
            )}
          </fieldset>

          <Button type="submit" full loading={submitting}>
            {submitting ? t('auth.creating') : t('auth.registerButton')}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          {t('auth.alreadyRegistered')}{' '}
          <Link to="/login" className="font-semibold text-brand-600 underline">
            {t('auth.loginButton')}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}