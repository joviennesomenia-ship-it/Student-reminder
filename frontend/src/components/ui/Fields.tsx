import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

const control =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-primary';

interface Wrapper {
  label: string;
  error?: string | undefined;
  children: ReactNode;
  hint?: string | undefined;
}

export function Field({ label, error, hint, children }: Wrapper) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && (
        <span className="mt-1 block text-xs font-medium text-accent" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined; hint?: string | undefined };
export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput({ label, error, hint, ...rest }, ref) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input ref={ref} className={control} aria-invalid={Boolean(error)} {...rest} />
    </Field>
  );
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string | undefined };
export const TextArea = forwardRef<HTMLTextAreaElement, AreaProps>(function TextArea({ label, error, ...rest }, ref) {
  return (
    <Field label={label} error={error}>
      <textarea ref={ref} rows={4} className={control} aria-invalid={Boolean(error)} {...rest} />
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string | undefined;
  options: { value: string; label: string }[];
};
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, options, ...rest }, ref) {
  return (
    <Field label={label} error={error}>
      <select ref={ref} className={control} aria-invalid={Boolean(error)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
});

export const controlClass = control;
