// Percentage of completed lessons, 0-100.
// Never shows 100 until EVERY lesson is done (e.g. 199/200 is 99, not 100).
export function calcPercent(done, total) {
  if (!total) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.round((done / total) * 100));
}