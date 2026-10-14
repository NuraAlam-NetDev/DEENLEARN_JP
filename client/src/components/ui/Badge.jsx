const tones = {
  green: 'bg-brand-100 text-brand-800',
  gold: 'bg-gold-100 text-gold-800',
  gray: 'bg-slate-100 text-slate-600',
  red: 'bg-red-100 text-red-700',
};

export default function Badge({ tone = 'gray', className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
