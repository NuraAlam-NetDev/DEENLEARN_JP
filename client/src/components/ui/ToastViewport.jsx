import Icon from './Icon.jsx';

const styles = {
  success: { border: 'border-s-brand-600', icon: 'check', color: 'text-brand-600' },
  error: { border: 'border-s-red-600', icon: 'error', color: 'text-red-600' },
  warning: { border: 'border-s-gold-500', icon: 'warning', color: 'text-gold-600' },
  info: { border: 'border-s-sky-600', icon: 'info', color: 'text-sky-600' },
};

// Full width at the top on phones, a stack in the top corner on larger screens
export default function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:end-0 sm:items-end sm:p-4"
    >
      {toasts.map((t) => {
        const s = styles[t.type];
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-brand-100 border-s-4 bg-white p-3 shadow-lg motion-safe:animate-toast-in ${s.border}`}
          >
            <span className={`mt-0.5 ${s.color}`}>
              <Icon name={s.icon} />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              {t.title && <p className="font-semibold text-slate-800">{t.title}</p>}
              <p className="break-words text-slate-600" dir="auto">
                {t.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="-me-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
