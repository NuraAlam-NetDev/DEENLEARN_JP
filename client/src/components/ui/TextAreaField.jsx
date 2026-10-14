import { useId } from 'react';

// Same look as FormField, for multi-line text. dir="auto" so Arabic/Bengali/English all flow correctly.
export default function TextAreaField({ label, hint, error, rows = 5, ...props }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        dir="auto"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-start text-base outline-none transition-colors placeholder:text-slate-400 focus:ring-2 sm:text-sm ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-brand-200 focus:border-brand-600 focus:ring-brand-600/20'
        }`}
        {...props}
      />
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
