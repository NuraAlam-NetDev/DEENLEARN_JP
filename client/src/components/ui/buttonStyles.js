const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900',
  gold: 'bg-gold-500 text-brand-950 hover:bg-gold-400 active:bg-gold-600',
  outline: 'border border-brand-700 text-brand-700 hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  light: 'bg-white/10 text-white hover:bg-white/20', // for dark backgrounds
};

// Touch-friendly: 44px tall on phones for the default size
const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm sm:h-10 sm:text-base',
  lg: 'h-12 px-6 text-base',
};

export function buttonClasses({ variant = 'primary', size = 'md', full = false, className = '' } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`.trim();
}
