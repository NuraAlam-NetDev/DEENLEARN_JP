import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import api, { getErrorMessage } from '../services/api.js';
import Button from './ui/Button.jsx';
import { Card, CardBody, CardHeader } from './ui/Card.jsx';

const input = 'h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600';
const METHODS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'phone', label: 'Phone call / SMS' },
  { value: 'email', label: 'Email only' },
  { value: 'other', label: 'Other app' },
];

// Address and how the school should reach the student. Your email is always used too.
export default function ContactDetails() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const d = user.details || {};
  const [form, setForm] = useState({
    address: d.address || '',
    city: d.city || '',
    country: d.country || '',
    contactMethod: d.contactMethod || 'email',
    contactNumber: d.contactNumber || '',
    contactOther: d.contactOther || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const needsNumber = form.contactMethod !== 'email';

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.patch('/auth/me/details', form);
      updateUser(data.user);
      toast.success('Your details are saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Contact details" />
      <CardBody>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Address</span>
            <input className={input} value={form.address} onChange={set('address')} maxLength={200} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">City / place</span>
            <input className={input} value={form.city} onChange={set('city')} maxLength={80} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Country</span>
            <input className={input} value={form.country} onChange={set('country')} maxLength={80} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Preferred way to reach you</span>
            <select className={input} value={form.contactMethod} onChange={set('contactMethod')}>
              {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          {needsNumber && (
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                {form.contactMethod === 'whatsapp' ? 'WhatsApp number' : 'Phone number'}
              </span>
              <input className={input} value={form.contactNumber} onChange={set('contactNumber')} placeholder="+8801XXXXXXXXX" dir="ltr" maxLength={30} />
            </label>
          )}
          {form.contactMethod === 'other' && (
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Which app, and your ID there</span>
              <input className={input} value={form.contactOther} onChange={set('contactOther')} maxLength={40} placeholder="e.g. Messenger: name" />
            </label>
          )}
          <p className="text-xs text-slate-500 sm:col-span-2">
            Your login email ({user.email}) is always kept on file for the school.
          </p>
          <div className="text-end sm:col-span-2">
            <Button type="submit" loading={busy}>Save details</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
