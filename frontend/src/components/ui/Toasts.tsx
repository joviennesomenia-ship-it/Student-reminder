import { useUi } from '@/store/ui';

const icon = { success: '✅', error: '⚠️', info: 'ℹ️' } as const;

export function Toasts() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto flex max-w-md items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm font-medium shadow-card"
        >
          <span aria-hidden="true">{icon[t.kind]}</span>
          {t.text}
        </button>
      ))}
    </div>
  );
}
