import { useId, useState } from 'react';
import Icon from './ui/Icon.jsx';

// Text direction follows the content: names/titles use dir="auto" (Arabic, Bengali, English all work),
// emails, passwords and URLs stay left-to-right even on a right-to-left page.
// type="password" gets a show/hide button. Pass error="..." to show a validation message.
export default function FormField({ label, hint, error, type = 'text', dir, ...inputProps }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const autoDir = ['email', 'password', 'url'].includes(type) ? 'ltr' : 'auto';
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          dir={dir ?? autoDir}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-lg border bg-white px-3 text-start text-base outline-none transition-colors placeholder:text-slate-400 focus:ring-2 sm:h-10 sm:text-sm ${
            isPassword ? 'pr-11' : ''
          } ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-brand-200 focus:border-brand-600 focus:ring-brand-600/20'
          }`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:text-brand-700"
          >
            <Icon name={show ? 'eye-off' : 'eye'} className="h-5 w-5" />
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
