export function Spinner({ className = '' }) {
  return (
    <div
      className={`h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  );
}
