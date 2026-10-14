import Icon from './ui/Icon.jsx';

const styles = {
  error: { box: 'border-red-200 bg-red-50 text-red-800', icon: 'error' },
  warning: { box: 'border-gold-300 bg-gold-50 text-gold-900', icon: 'warning' },
  info: { box: 'border-sky-200 bg-sky-50 text-sky-900', icon: 'info' },
  success: { box: 'border-brand-200 bg-brand-50 text-brand-900', icon: 'check' },
};

export default function Alert({ type = 'error', children }) {
  const s = styles[type];
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${s.box}`} role="alert">
      <span className="mt-0.5 shrink-0">
        <Icon name={s.icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}
