import type { ReactNode } from 'react';
import { Button } from './Button';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} aria-hidden="true" />;
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-36" />
      ))}
    </div>
  );
}

export function EmptyState({ emoji, title, hint, action }: { emoji: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl2 border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div className="text-5xl" aria-hidden="true">{emoji}</div>
      <p className="mt-3 text-lg font-semibold">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-xl2 border border-accent/30 bg-accent/5 px-6 py-10 text-center" role="alert">
      <div className="text-4xl" aria-hidden="true">⚠️</div>
      <p className="mt-3 font-semibold">Could not load this section</p>
      <p className="mt-1 text-sm text-muted">Check your internet connection, then try again. If it keeps failing, tell your teacher.</p>
      {onRetry && (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
