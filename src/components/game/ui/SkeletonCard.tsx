import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  lines?: number;
  className?: string;
  variant?: 'card' | 'row' | 'message';
}

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded bg-muted/30 animate-pulse relative overflow-hidden',
      className
    )}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-muted/20 to-transparent" />
    </div>
  );
}

export function SkeletonCard({ lines = 3, className, variant = 'card' }: SkeletonCardProps) {
  if (variant === 'message') {
    return (
      <div className={cn('flex gap-2 mb-2', className)}>
        <ShimmerBar className="w-7 h-7 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <ShimmerBar className="h-2.5 w-16" />
          <ShimmerBar className="h-3 w-3/4" />
          <ShimmerBar className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-lg border border-border bg-card', className)}>
        <ShimmerBar className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <ShimmerBar className="h-3 w-2/5" />
          <ShimmerBar className="h-2.5 w-3/5" />
        </div>
        <ShimmerBar className="h-6 w-16 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('p-4 rounded-lg border border-border bg-card space-y-2.5', className)}>
      <ShimmerBar className="h-4 w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBar key={i} className={`h-3 ${i === lines - 1 ? 'w-1/3' : 'w-full'}`} />
      ))}
    </div>
  );
}
