import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const styles: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-border bg-surface text-fg hover:border-primary hover:text-primary',
  danger: 'bg-accent text-on-accent hover:opacity-90',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
}

export function Button({ variant = 'primary', small, className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${
        small ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
      } ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
