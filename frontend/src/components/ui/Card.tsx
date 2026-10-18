import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl2 border border-border bg-surface p-5 shadow-card ${className}`} {...rest} />;
}
