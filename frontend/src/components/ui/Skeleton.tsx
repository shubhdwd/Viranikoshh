
import { cn } from '../../utils/cn';
export function Skeleton({
  className


}: {className?: string;}) {
  return <div className={cn('animate-pulse bg-sand-lighter rounded-md', className)} />;
}
export function PostCardSkeleton() {
  return <div className="bg-paper border border-sand-light rounded-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>;
}
export function GridSkeleton({
  count = 8


}: {count?: number;}) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({
      length: count
    }).map((_, i) => <Skeleton key={i} className={cn('w-full rounded-card', i % 3 === 0 ? 'h-64' : 'h-48')} />)}
    </div>;
}
