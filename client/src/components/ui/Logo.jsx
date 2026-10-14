import { useId } from 'react';
import { Link } from 'react-router-dom';

// The Deenlearn mark: crescent, star and open book on a green tile with a gold rim.
// Each instance gets its own gradient ids, so several logos on one page never clash.
export function LogoMark({ className = 'h-10 w-10' }) {
  const raw = useId().replace(/:/g, '');
  const bg = `${raw}-bg`;
  const gold = `${raw}-gold`;
  const page = `${raw}-page`;

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b7a57" />
          <stop offset="1" stopColor="#0b3d2e" />
        </linearGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7dd8a" />
          <stop offset="1" stopColor="#c9962a" />
        </linearGradient>
        <linearGradient id={page} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf5" />
          <stop offset="1" stopColor="#eadfc4" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="15" fill={`url(#${bg})`} />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="14.25"
        fill="none"
        stroke="#d4af37"
        strokeWidth="1.5"
        strokeOpacity="0.9"
      />
      <path d="M38 13.5a11 11 0 1 0 0 21 8.5 8.5 0 1 1 0-21z" fill={`url(#${gold})`} />
      <path
        d="M47.5 15.2l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.5-2.5 1.5.6-2.8-2.1-1.9 2.8-.3z"
        fill="#f7dd8a"
      />
      <path
        d="M10 39c6-2.6 12-2.2 22 2.6 10-4.8 16-5.2 22-2.6v11c-6-2.2-12-1.8-22 2.6-10-4.4-16-4.8-22-2.6z"
        fill={`url(#${page})`}
        stroke="#0b3d2e"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M32 41.6v11" stroke="#c9962a" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M14 42.5c4.5-1.6 9-1.4 14.5.9M36 43.4c5.5-2.3 10-2.5 14-.9"
        fill="none"
        stroke="#c9962a"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

// Kept for older imports: the mark alone
export const Logo = LogoMark;

// The full lockup: mark + "DeenLearn" wordmark, linked to the home page.
// tone="light" for dark backgrounds (navbar, footer), tone="dark" for white ones (sidebar).
// The brand name always reads left-to-right, even on Arabic and Urdu pages.
export function BrandLink({ tone = 'light', className = '' }) {
  const isLight = tone === 'light';
  const deen = isLight ? 'text-white' : 'text-brand-800';
  const learn = isLight ? 'text-gold-300' : 'text-gold-600';

  return (
    <Link
      to="/"
      dir="ltr"
      aria-label="Deenlearn"
      className={`group inline-flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${className}`}
    >
      <LogoMark className="h-10 w-10 shrink-0 drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)] transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105" />
      <span className="font-display text-[1.65rem] leading-none tracking-tight">
        <span className={`font-bold ${deen}`}>Deen</span>
        <span className={`font-extrabold ${learn}`}>Learn</span>
      </span>
    </Link>
  );
}
