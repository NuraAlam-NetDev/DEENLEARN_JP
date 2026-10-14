import Plan from '../models/Plan.js';
import { notify } from '../utils/notify.js';
import { remainingOf } from './plans.js';
import { formatMoney } from '../utils/money.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const TOPUP_DAYS = 14; // time the student has to pay a price increase, before the grace period starts

// Called when a course price changes (JPY or USD). Every student on that course in that currency is handled:
//   - PRICE UP, still owes money: the difference is added to their last installment.
//   - PRICE UP, already paid in full (paid cash or card): a new installment for the difference is added.
//     It is due in 14 days and can be paid in the app (card or cash). Notification + email.
//   - PRICE DOWN, still owes money: the difference is taken off their unpaid part (never below what they paid).
//   - PRICE DOWN, paid in full: nothing automatic. Refund manually from the Refunds page if needed.
export async function applyPriceChangeToPlans({ courseId, currency, from, to }) {
  const diff = to - from;
  if (!diff) return 0;

  const plans = await Plan.find({ course: courseId, currency });
  const now = new Date();
  let changed = 0;

  for (const plan of plans) {
    if (!plan.schedule.length) continue;
    const owing = remainingOf(plan) > 0;

    if (diff > 0) {
      if (owing) {
        plan.schedule[plan.schedule.length - 1].amount += diff;
      } else {
        plan.schedule.push({
          no: plan.schedule.length + 1,
          amount: diff,
          paid: 0,
          dueAt: new Date(now.getTime() + TOPUP_DAYS * DAY_MS),
          reminded: false,
        });
      }
    } else {
      if (!owing) continue; // paid in full: no automatic refund
      let left = -diff;
      for (const e of [...plan.schedule].reverse()) {
        const room = e.amount - e.paid;
        if (room <= 0) continue;
        const take = Math.min(room, left);
        e.amount -= take;
        left -= take;
        if (left <= 0) break;
      }
    }

    plan.total = plan.schedule.reduce((sum, e) => sum + e.amount, 0);
    await plan.save();
    changed += 1;

    const owed = remainingOf(plan);
    const body = diff > 0
      ? `The price of a course you have bought changed from ${from} to ${formatMoney(to, currency)}. ` +
        (owing
          ? `Your balance is now ${formatMoney(owed, currency)}.`
          : `You owe the difference of ${formatMoney(diff, currency)}. Please pay it in the app within ${TOPUP_DAYS} days.`)
      : `The price of a course you have bought changed from ${from} to ${formatMoney(to, currency)}. Your balance is now ${formatMoney(owed, currency)}.`;

    await notify(plan.student, {
      type: 'payment',
      title: diff > 0 ? 'Course price increased' : 'Course price reduced',
      body,
      link: '/student/courses',
      email: true,
      kind: 'payment',
    });
  }
  return changed;
}
