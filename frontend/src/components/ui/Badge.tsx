import type { ReactNode } from 'react';
import type { Tone } from '@/utils/date';

const tones: Record<Tone | 'neutral' | 'done', string> = {
  overdue: 'bg-accent/10 text-accent',
  urgent: 'bg-accent/10 text-accent',
  soon: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200',
  ok: 'bg-primary/10 text-primary',
  neutral: 'bg-surface-2 text-muted',
  done: 'bg-surface-2 text-muted',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone | 'neutral' | 'done'; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
