export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-brand-100 ${className}`} aria-hidden="true" />;
}

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-100 bg-white">
      <Skeleton className="aspect-video rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
