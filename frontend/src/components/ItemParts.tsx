import { downloadIcs } from '@/utils/ics';
import type { CalItem } from '@/hooks/useCalendarItems';
import { toIcs } from '@/hooks/useCalendarItems';
import { useIsAdmin } from '@/api/hooks';
import { useAdminForm, useConfirm, type EntityType } from '@/store/admin';
import { useRemove, type EntityKey } from '@/api/hooks';
import { useDone } from '@/store/done';
import { countdown, type DueStatus } from '@/utils/date';
import type { Attachment, Priority, Subject } from '@/types';
import { downloadHref, fileIcon, formatSize, linkIcon } from '@/utils/files';
import { formatShortDate } from '@/utils/date';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export function SubjectChip({ subject }: { subject: Subject | undefined }) {
  if (!subject) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-semibold">
      <span aria-hidden="true">{subject.emoji}</span>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden="true" />
      {subject.name}
    </span>
  );
}

const PRIORITY: Record<Priority, { label: string; tone: 'overdue' | 'soon' | 'ok' }> = {
  HIGH: { label: 'High priority', tone: 'overdue' },
  MEDIUM: { label: 'Medium', tone: 'soon' },
  LOW: { label: 'Low', tone: 'ok' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const p = PRIORITY[priority];
  return <Badge tone={p.tone}>{p.label}</Badge>;
}

export function CountdownBadge({ dueAt, now, done }: { dueAt: string; now: Date; done?: boolean }) {
  if (done) return <Badge tone="done">✅ Done</Badge>;
  const c = countdown(dueAt, now);
  return <Badge tone={c.tone}>⏰ {c.label}</Badge>;
}

export function StatusBadge({ status }: { status: DueStatus }) {
  const tone = status === 'Overdue' ? 'overdue' : status === 'Due Soon' ? 'soon' : 'ok';
  return <Badge tone={tone}>{status}</Badge>;
}

export function DoneToggle({ id }: { id: string }) {
  const done = useDone((s) => s.done.includes(id));
  const toggle = useDone((s) => s.toggle);
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={done} onChange={() => toggle(id)} className="h-4 w-4 accent-[rgb(var(--color-primary))]" />
      ✅ Done
    </label>
  );
}

export function AttachmentList({ attachments }: { attachments: Attachment[] | undefined }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5">
      {attachments.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 text-sm">
          <span aria-hidden="true">{a.kind === 'file' ? fileIcon(a.mimeType, a.name) : linkIcon(a.url)}</span>
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-medium text-primary hover:underline">
            {a.kind === 'file' ? '📎 ' : '🔗 '}
            {a.name}
          </a>
          {a.kind === 'file' && (
            <>
              <span className="text-xs text-muted">
                {formatSize(a.size)} · {formatShortDate(a.createdAt)}
              </span>
              <a href={downloadHref(a.url)} download className="text-xs font-semibold text-primary hover:underline">
                Download
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Edit / delete / pin controls. Renders nothing for students. */
export function AdminActions({ type, item, id, title }: { type: EntityType; item: object; id: string; title: string }) {
  const isAdmin = useIsAdmin();
  const open = useAdminForm((s) => s.open);
  const ask = useConfirm((s) => s.ask);
  const remove = useRemove(type as EntityKey);
  if (!isAdmin) return null;
  return (
    <div className="flex gap-1.5">
      <Button small variant="secondary" onClick={() => open(type, item)} aria-label={`Edit ${title}`}>
        ✏️ Edit
      </Button>
      <Button
        small
        variant="ghost"
        aria-label={`Delete ${title}`}
        onClick={async () => {
          if (await ask(`Delete "${title}"?`, 'This also removes its files and links. It cannot be undone.')) remove.mutate(id);
        }}
      >
        🗑️ Delete
      </Button>
    </div>
  );
}

export function AddButton({ type, label }: { type: EntityType; label: string }) {
  const isAdmin = useIsAdmin();
  const open = useAdminForm((s) => s.open);
  if (!isAdmin) return null;
  return <Button variant="danger" onClick={() => open(type)}>＋ {label}</Button>;
}

export function CalendarButton({ item, label = '📅 Add to my calendar' }: { item: CalItem; label?: string }) {
  return (
    <Button small variant="ghost" onClick={() => downloadIcs([toIcs(item)], item.title.replace(/[^\w-]+/g, '_'))}>
      {label}
    </Button>
  );
}

export function PageHeader({ emoji, title, subtitle, actions }: { emoji: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-xl2 bg-ink px-6 py-6 text-white shadow-card sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full bg-primary/40" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-14 right-24 h-32 w-32 rounded-full bg-accent/40" aria-hidden="true" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-2 block h-1 w-12 rounded bg-accent" aria-hidden="true" />
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span aria-hidden="true">{emoji} </span>
            {title}
          </h1>
          {subtitle && <p className="mt-1 max-w-xl text-sm text-white/80">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function PinMark({ pinned }: { pinned: boolean }) {
  return pinned ? <span title="Pinned" aria-label="Pinned">📌</span> : null;
}
