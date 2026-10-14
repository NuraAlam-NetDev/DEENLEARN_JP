import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { formatDate } from '../../utils/format.js';
import Alert from '../../components/Alert.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

const EMPTY = { code: '', kind: 'percent', value: '', currency: 'ANY', course: '', expiresAt: '', maxUses: '0' };
const input = 'h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600';

// Discount codes. Admins: any course (or all). Teachers: their own courses (the server checks this too).
// coursesPath: where the course list comes from (/admin/courses or /teacher/courses)
export default function Coupons({ coursesPath, isTeacher = false }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/coupons');
  const courses = useFetch(`${coursesPath}?limit=50`);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/coupons', {
        code: form.code.trim(),
        kind: form.kind,
        value: Number(form.value),
        currency: form.currency,
        course: form.course || undefined,
        expiresAt: form.expiresAt || undefined,
        maxUses: Number(form.maxUses || 0),
      });
      toast.success(t('extras.coupons.created'));
      setForm(EMPTY);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(c) {
    try {
      await api.patch(`/coupons/${c._id}`);
      toast.success(t('extras.coupons.switchedOff'));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('extras.coupons.title')}</h1>
        <p className="mt-1 text-slate-600">{t('extras.coupons.subtitle')}</p>
      </div>

      <Card className="p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className={input} placeholder={t('extras.coupons.codePlaceholder')} value={form.code} onChange={set('code')} dir="ltr" required />
          <select className={input} value={form.kind} onChange={set('kind')}>
            <option value="percent">{t('extras.coupons.percent')}</option>
            <option value="fixed">{t('extras.coupons.fixed')}</option>
          </select>
          <input
            className={input}
            type="number"
            min="1"
            placeholder={form.kind === 'percent' ? t('extras.coupons.percentPlaceholder') : t('extras.coupons.amountPlaceholder')}
            value={form.value}
            onChange={set('value')}
            required
          />
          <select className={input} value={form.currency} onChange={set('currency')}>
            <option value="ANY">{t('extras.coupons.anyCurrency')}</option>
            <option value="JPY">{t('extras.coupons.jpyOnly')}</option>
            <option value="USD">{t('extras.coupons.usdOnly')}</option>
          </select>
          <select className={input} value={form.course} onChange={set('course')} required={isTeacher}>
            <option value="">{isTeacher ? t('extras.coupons.chooseCourse') : t('extras.coupons.anyCourse')}</option>
            {(courses.data?.courses ?? []).map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
          <input className={input} type="date" value={form.expiresAt} onChange={set('expiresAt')} title={t('extras.coupons.expiry')} />
          <input className={input} type="number" min="0" placeholder={t('extras.coupons.maxUses')} value={form.maxUses} onChange={set('maxUses')} />
          <Button type="submit" loading={busy}>{t('extras.coupons.create')}</Button>
        </form>
      </Card>

      {loading && !data && <Spinner />}
      {error && <Alert>{error}</Alert>}

      {data && (
        <ul className="space-y-2">
          {data.coupons.map((c) => (
            <li key={c._id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-mono font-semibold text-slate-800">{c.code}</p>
                  <p className="text-xs text-slate-500">
                    {c.kind === 'percent' ? `${c.value}%` : `${c.value}`}
                    {c.currency !== 'ANY' ? ` · ${c.currency}` : ''}
                    {' · '}{c.course?.title ?? t('extras.coupons.any')}
                    {c.expiresAt ? ` · ${t('extras.coupons.until')} ${formatDate(c.expiresAt)}` : ''}
                    {` · ${t('extras.coupons.used', { n: c.uses })}${c.maxUses ? ` ${t('extras.coupons.limit', { n: c.maxUses })}` : ''}`}
                  </p>
                </div>
                {c.active ? (
                  <Button variant="outline" size="sm" onClick={() => deactivate(c)}>{t('extras.coupons.switchOff')}</Button>
                ) : (
                  <span className="text-sm text-slate-500">{t('extras.coupons.off')}</span>
                )}
              </Card>
            </li>
          ))}
          {data.coupons.length === 0 && <p className="text-sm text-slate-500">{t('extras.coupons.none')}</p>}
        </ul>
      )}
    </div>
  );
}
