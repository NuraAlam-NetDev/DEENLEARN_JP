import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api, { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { useFetch } from '../../hooks/useFetch.js';
import Button from '../ui/Button.jsx';
import Alert from '../Alert.jsx';

const money = (amount, currency) => (currency === 'JPY' ? `¥${Number(amount).toLocaleString()}` : `$${amount}`);
const day = (d) => new Date(d).toLocaleDateString();
const input = 'h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm outline-none focus:border-brand-600';

// Paying for a course: the first payment (choose installments, or pay in part), and later
// payments of the remaining installments. Shown before enrolling, and after enrolling while a balance is owed.
export default function PaymentOptions({ course, enrolled = false }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, reload } = useFetch(`/payments/plan/${course._id}`);
  const [busy, setBusy] = useState('');
  const [cashDone, setCashDone] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [installments, setInstallments] = useState('1');
  const [amount, setAmount] = useState('');

  if (!data) return null;
  const plan = data.plan;
  if (enrolled && !plan) return null;               // bought before plans existed: nothing to pay
  if (plan && plan.remaining <= 0) {
    return <Alert type="info">This course is paid in full. You can study it now.</Alert>;
  }
  if (cashDone) return <Alert type="info">{t('cash.sent')}</Alert>;

  const price = data.price;
  const currency = plan ? plan.currency : null;
  const showJPY = plan ? plan.currency === 'JPY' : price.JPY > 0;
  const showUSD = plan ? plan.currency === 'USD' : price.USD > 0;
  const owed = plan ? plan.remaining : null;
  const suggested = plan ? (plan.nextDue ? plan.nextDue.owed : plan.remaining) : null;
  const minimum = data.minimum;

  async function requestAccess() {
    const reason = window.prompt('Why do you need free access? (optional)', '') ?? null;
    if (reason === null) return;
    try {
      await api.post('/access-requests', { courseId: course._id, reason });
      toast.success('Request sent. The admin will answer soon.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function pay(provider, cur) {
    setBusy(provider + cur);
    try {
      const body = { courseId: course._id, provider, currency: cur };
      if (!plan) body.installments = Number(installments);
      if (amount.trim()) body.amount = Number(amount);
      if (!plan && coupon.trim()) body.couponCode = coupon.trim();
      const { data: res } = await api.post('/payments/checkout', body);
      if (provider === 'cash') {
        setCashDone(true);
        return;
      }
      toast.success(t('cash.redirecting'));
      window.location.href = res.url; // Stripe's payment page takes over
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-3">
      {plan && plan.overdue && (
        <Alert>An installment is overdue. Pay it now to keep access to the lessons.</Alert>
      )}

      {plan ? (
        <div className="rounded-lg border border-brand-100 p-3 text-sm text-slate-700">
          <p className="font-semibold text-brand-800">
            Paid {money(plan.paid, plan.currency)} of {money(plan.total, plan.currency)}
          </p>
          {plan.nextDue && (
            <p>
              Next: installment {plan.nextDue.no} of {plan.schedule.length} — {money(plan.nextDue.owed, plan.currency)} due {day(plan.nextDue.dueAt)}
            </p>
          )}
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {plan.schedule.map((e) => (
              <li key={e.no}>
                {e.no}. {money(e.amount, plan.currency)} · due {day(e.dueAt)} · {e.status}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600">{t('cash.chooseHint')}</p>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Pay in installments</span>
            <select className={input} value={installments} onChange={(e) => setInstallments(e.target.value)}>
              <option value="1">Pay in full</option>
              <option value="2">2 monthly installments</option>
              <option value="3">3 monthly installments</option>
              <option value="6">6 monthly installments</option>
            </select>
          </label>
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder={t('extras.checkout.discountPlaceholder')}
            aria-label={t('extras.checkout.discountLabel')}
            maxLength={30}
            dir="ltr"
            className={input}
          />
        </>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">
          {plan ? 'Amount to pay now (optional)' : 'First payment (optional)'}
        </span>
        <input
          type="number"
          min="1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={String(suggested ?? '')}
          className={input}
        />
        <span className="text-xs text-slate-500">
          Leave empty to pay {plan ? 'the next installment' : 'the first installment'}. Minimum partial payment: {currency ? minimum[currency] : ''}
        </span>
      </label>

      {showJPY && (
        <>
          <Button full loading={busy === 'stripeJPY'} disabled={!!busy} onClick={() => pay('stripe', 'JPY')}>
            {t('cash.optionCard', { amount: money(amount.trim() ? Number(amount) : (plan ? suggested : price.JPY), 'JPY') })}
          </Button>
          <Button full variant="outline" loading={busy === 'cashJPY'} disabled={!!busy} onClick={() => pay('cash', 'JPY')}>
            {t('cash.optionCash', { amount: money(amount.trim() ? Number(amount) : (plan ? suggested : price.JPY), 'JPY') })}
          </Button>
        </>
      )}
      {showUSD && (
        <Button full variant="outline" loading={busy === 'stripeUSD'} disabled={!!busy} onClick={() => pay('stripe', 'USD')}>
          {t('cash.optionCard', { amount: money(amount.trim() ? Number(amount) : (plan ? suggested : price.USD), 'USD') })}
        </Button>
      )}
      {owed !== null && owed > 0 && (
        <Button variant="outline" full onClick={requestAccess}>Request free access</Button>
      )}
      {owed !== null && <p className="text-xs text-slate-500">Balance owed: {money(owed, currency)}</p>}
    </div>
  );
}
