// Money in messages and emails. JPY: ¥5,000. USD: $50.00.
export function formatMoney(amount, currency) {
  const n = Number(amount) || 0;
  if (currency === 'JPY') return `¥${Math.round(n).toLocaleString('en-US')}`;
  if (currency === 'USD') return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${n.toLocaleString('en-US')} ${currency}`;
}
