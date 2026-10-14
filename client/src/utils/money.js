// Money display. JPY: ¥5,000 (no decimals). USD: $50.00. Older BDT records still show as "৳".
const SYMBOL = { JPY: '¥', USD: '$', BDT: '৳' };

export function formatMoney(amount, currency = 'JPY') {
  const n = Number(amount) || 0;
  if (currency === 'JPY') return `${SYMBOL.JPY}${Math.round(n).toLocaleString('en-US')}`;
  if (currency === 'USD') return `${SYMBOL.USD}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === 'BDT') return `${SYMBOL.BDT}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${n.toLocaleString('en-US')} ${currency}`;
}

// Course price (normal units, 0 = free)
export const formatPrice = (price, currency = 'JPY') => (price > 0 ? formatMoney(price, currency) : 'Free');
// Kept for older screens: the server stores whole units now, so this is the same as formatMoney
export const formatMinor = (amount, currency = 'JPY') => formatMoney(amount, currency);
export const isPaid = (course) => Number(course?.priceJPY) > 0 || Number(course?.priceUSD) > 0 || Number(course?.price) > 0;
