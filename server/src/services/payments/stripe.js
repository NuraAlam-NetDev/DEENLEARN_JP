import crypto from 'crypto';
import { httpError } from '../../utils/httpError.js';

// Stripe Checkout: card payments in JPY or USD.
const API = 'https://api.stripe.com/v1';

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

// JPY has no minor unit: 5000 yen is sent as 5000.
// USD is sent in cents: 50 dollars is sent as 5000.
export const toStripeAmount = (amount, currency) => (currency === 'JPY' ? amount : amount * 100);

// Creates a Checkout Session. Returns the URL the browser opens, and the session id.
export async function startStripeCheckout({ order, course, clientUrl }) {
  const body = new URLSearchParams({
    mode: 'payment',
    success_url: `${clientUrl}/payment/result?order=${order._id}`,
    cancel_url: `${clientUrl}/payment/result?order=${order._id}&cancelled=1`,
    client_reference_id: String(order._id),
    'metadata[orderId]': String(order._id),
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': order.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(toStripeAmount(order.amount, order.currency)),
    'line_items[0][price_data][product_data][name]': course.title.slice(0, 250),
  });

  const res = await fetch(`${API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.url) {
    console.error('Stripe checkout failed:', json?.error?.message || res.status);
    throw httpError(502, 'Could not start the card payment. Please try again.');
  }
  return { url: json.url, id: json.id };
}

// Checks the Stripe-Signature header, so only Stripe can mark an order as paid.
// rawBody must be the untouched request body (Buffer).
export function verifyStripeSignature(rawBody, header) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header || !Buffer.isBuffer(rawBody)) return false;

  const parts = header.split(',');
  const t = parts.find((p) => p.startsWith('t='))?.slice(2);
  const sigs = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // old request: reject replays

  const payload = Buffer.concat([Buffer.from(`${t}.`), rawBody]);
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(payload).digest('hex'));
  return sigs.some((s) => {
    const got = Buffer.from(s);
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  });
}

// Refunds part or all of a card payment. paymentIntentId comes from the confirmed payment.
// Returns the Stripe refund id.
export async function refundStripePayment({ paymentIntentId, amount, currency }) {
  const body = new URLSearchParams({
    payment_intent: paymentIntentId,
    amount: String(toStripeAmount(amount, currency)),
  });
  const res = await fetch(`${API}/refunds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.id) {
    console.error('Stripe refund failed:', json?.error?.message || res.status);
    throw httpError(502, 'The card refund could not be made. Nothing was changed. Try again or refund in the Stripe dashboard.');
  }
  return json.id;
}
