import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsAdmin } from '@/api/hooks';
import { useAdminForm, type EntityType } from '@/store/admin';

const OPTIONS: { type: EntityType; label: string; emoji: string; path: string }[] = [
  { type: 'task', label: 'Task', emoji: '📋', path: '/tasks' },
  { type: 'performanceTask', label: 'Performance task', emoji: '🎯', path: '/performance-tasks' },
  { type: 'reviewer', label: 'Reviewer', emoji: '📚', path: '/reviewers' },
  { type: 'event', label: 'Event', emoji: '🎉', path: '/events' },
  { type: 'announcement', label: 'Announcement', emoji: '📢', path: '/announcements' },
  { type: 'subject', label: 'Subject', emoji: '🏷️', path: '/reviewers' },
];

/** The teacher's "＋ Add" button. Renders nothing for students. */
export function QuickAdd({ floating = false }: { floating?: boolean }) {
  const isAdmin = useIsAdmin();
  const open = useAdminForm((s) => s.open);
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  if (!isAdmin) return null;

  // The kind of item that belongs to the page you are on goes first.
  const here = OPTIONS.find((o) => o.path === pathname && o.type !== 'subject');
  const options = here ? [here, ...OPTIONS.filter((o) => o !== here)] : OPTIONS;

  const trigger = floating
    ? 'flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-base font-bold text-on-accent shadow-xl hover:opacity-90'
    : 'flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-bold text-on-accent hover:opacity-90';

  return (
    <div ref={box} className={floating ? 'fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6' : 'relative'}>
      <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} className={trigger}>
        <span className="text-xl leading-none" aria-hidden="true">＋</span>
        Add
      </button>
      {menu && (
        <div
          role="menu"
          aria-label="Add something new"
          className={`absolute z-50 w-64 rounded-xl2 border border-border bg-surface p-2 shadow-card ${floating ? 'bottom-full right-0 mb-3' : 'right-0 top-full mt-2'}`}
        >
          <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted">Add new</p>
          {options.map((o, i) => (
            <button
              key={o.type}
              role="menuitem"
              onClick={() => {
                setMenu(false);
                open(o.type);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-fg hover:bg-surface-2"
            >
              <span className="text-xl" aria-hidden="true">{o.emoji}</span>
              {o.label}
              {i === 0 && here && <span className="ml-auto text-xs font-medium text-muted">this page</span>}
            </button>
          ))}
          <Link to="/admin" onClick={() => setMenu(false)} className="mt-1 block rounded-lg border-t border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-2">
            🔐 Open admin panel
          </Link>
        </div>
      )}
    </div>
  );
}
