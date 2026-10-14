import Alert from '../Alert.jsx';
import Button from './Button.jsx';
import EmptyState from './EmptyState.jsx';
import { Spinner } from '../Spinner.jsx';

// One place for the three states every list or page has: loading, failed, and nothing to show.
// Usage (pass the labels from i18n, so they follow the chosen language):
//
//   <QueryState
//     loading={loading && !data}
//     error={error}
//     onRetry={reload}
//     retryLabel={t('shared.retry')}
//     empty={data && data.items.length === 0}
//     emptyTitle={t('courses.noneTitle')}
//     emptyText={t('courses.noneText')}
//     skeleton={<CourseGridSkeleton />}      // optional: a shape-matching placeholder while loading
//   >
//     ...the real content...
//   </QueryState>
export default function QueryState({
  loading = false,
  error = '',
  onRetry,
  retryLabel = 'Try again',
  loadingLabel = 'Loading…',
  empty = false,
  emptyTitle = '',
  emptyText = '',
  emptyAction = null,
  skeleton = null,
  children = null,
}) {
  if (loading) {
    return (
      skeleton ?? (
        <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col items-center gap-2 py-10">
          <Spinner />
          <span className="text-sm text-slate-500">{loadingLabel}</span>
        </div>
      )
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Alert>{error}</Alert>
        {onRetry && (
          <div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (empty) {
    return <EmptyState title={emptyTitle} text={emptyText} action={emptyAction} />;
  }

  return children;
}
