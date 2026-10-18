import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { controlClass } from './ui/Fields';
import { ErrorState, SkeletonList } from './ui/States';

export function SearchBox({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative min-w-[12rem] flex-1">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${controlClass} pl-9`}
      />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={`${controlClass} w-auto`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center gap-2">{children}</div>;
}

/** Shows a loading skeleton or error state, otherwise the children. */
export function QueryState({ query, children }: { query: UseQueryResult<unknown>; children: ReactNode }) {
  if (query.isLoading) return <SkeletonList />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  return <>{children}</>;
}
