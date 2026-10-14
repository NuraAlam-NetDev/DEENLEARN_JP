import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx';
import FormField from '../../components/FormField.jsx';
import Alert from '../../components/Alert.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Spinner } from '../../components/Spinner.jsx';

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function AdminAdmins() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/users?role=admin&limit=50');

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.post('/admin/admins', form);
      toast.success(t('admin.admins.created'));
      setForm(EMPTY_FORM);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(admin) {
    if (!window.confirm(t('admin.admins.confirmRemove', { name: admin.name }))) return;
    setBusyId(admin._id);
    try {
      await api.patch(`/admin/users/${admin._id}/role`, { role: 'student' });
      toast.success(t('admin.admins.removed'));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-5 text-3xl font-bold text-brand-800">{t('admin.admins.title')}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('admin.admins.createTitle')} subtitle={t('admin.admins.createSubtitle')} />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <FormField label={t('admin.admins.name')} name="name" value={form.name} onChange={onChange} />
              <FormField
                label={t('admin.admins.email')}
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
              />
              <FormField
                label={t('admin.admins.tempPassword')}
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                hint={t('auth.passwordHint')}
              />
              {formError && <Alert>{formError}</Alert>}
              <Button type="submit" loading={saving} full>
                {t('admin.admins.createButton')}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('admin.admins.currentTitle')} />
          <CardBody className="space-y-3">
      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.users.length === 0}
        emptyTitle={t('admin.admins.emptyTitle')}
        emptyText={t('admin.admins.emptyText')}
      >
              {data &&
                data.users.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800" dir="auto">
                        {a.name}
                      </p>
                      <p className="truncate text-sm text-slate-500" dir="ltr">
                        {a.email}
                      </p>
                    </div>
                    <Button size="sm" variant="danger" loading={busyId === a._id} onClick={() => handleRemove(a)}>
                      {t('admin.admins.remove')}
                    </Button>
                  </div>
                ))}
      </QueryState>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
