import { Link } from 'react-router-dom';
import { buttonClasses } from './buttonStyles.js';

export default function Button({
  variant,
  size,
  full,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, full, className })}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

// A react-router <Link> that looks like a button
export function ButtonLink({ variant, size, full, className, ...props }) {
  return <Link className={buttonClasses({ variant, size, full, className })} {...props} />;
}
