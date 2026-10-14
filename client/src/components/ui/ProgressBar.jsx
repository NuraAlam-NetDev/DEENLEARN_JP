export default function ProgressBar({ value = 0, label, className = '' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={className}>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-brand-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-600 to-gold-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{pct}% complete</p>
    </div>
  );
}
