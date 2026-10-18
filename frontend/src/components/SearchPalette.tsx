import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, usePerformanceTasks, useReviewers, useTasks } from '@/api/hooks';
import { useUi } from '@/store/ui';
import { formatShortDate } from '@/utils/date';
import { Modal } from './ui/Modal';

interface Hit {
  key: string;
  emoji: string;
  title: string;
  meta: string;
  to: string;
}

export function SearchPalette() {
  const open = useUi((s) => s.searchOpen);
  const setOpen = useUi((s) => s.setSearchOpen);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const tasks = useTasks();
  const pts = usePerformanceTasks();
  const reviewers = useReviewers();
  const events = useEvents();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUi.getState().searchOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      window.setTimeout(() => input.current?.focus(), 30);
    }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const match = (...parts: string[]) => parts.some((p) => p.toLowerCase().includes(needle));
    const link = (path: string) => `${path}?q=${encodeURIComponent(q.trim())}`;
    return [
      ...(tasks.data ?? []).filter((t) => match(t.title, t.description)).map((t) => ({ key: `t${t.id}`, emoji: '📋', title: t.title, meta: `Task, due ${formatShortDate(t.dueAt)}`, to: link('/tasks') })),
      ...(pts.data ?? []).filter((t) => match(t.title, t.description)).map((t) => ({ key: `p${t.id}`, emoji: '🎯', title: t.title, meta: `Performance task, due ${formatShortDate(t.dueAt)}`, to: link('/performance-tasks') })),
      ...(reviewers.data ?? []).filter((r) => match(r.title, r.description, r.tag)).map((r) => ({ key: `r${r.id}`, emoji: '📚', title: r.title, meta: `Reviewer${r.tag ? `, ${r.tag}` : ''}`, to: link('/reviewers') })),
      ...(events.data ?? []).filter((e) => match(e.title, e.description, e.location)).map((e) => ({ key: `e${e.id}`, emoji: '🎉', title: e.title, meta: `Event, ${formatShortDate(e.startsAt)}`, to: link('/events') })),
    ].slice(0, 20);
  }, [q, tasks.data, pts.data, reviewers.data, events.data]);

  const go = (hit: Hit | undefined) => {
    if (!hit) return;
    setOpen(false);
    navigate(hit.to);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="🔍 Search">
      <input
        ref={input}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, hits.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') go(hits[active]);
        }}
        placeholder="Search tasks, reviewers, events..."
        aria-label="Search"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base placeholder:text-muted focus-visible:border-primary"
      />
      <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto" role="listbox">
        {q.trim() && hits.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">Nothing matches "{q}".</li>}
        {hits.map((h, i) => (
          <li key={h.key} role="option" aria-selected={i === active}>
            <button
              onClick={() => go(h)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === active ? 'bg-primary/10' : 'hover:bg-surface-2'}`}
            >
              <span className="text-xl" aria-hidden="true">{h.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{h.title}</span>
                <span className="block text-xs text-muted">{h.meta}</span>
              </span>
            </button>
          </li>
        ))}
        {!q.trim() && <li className="px-2 py-6 text-center text-sm text-muted">Type to search. Tip: Ctrl+K (or ⌘K) opens this anywhere.</li>}
      </ul>
    </Modal>
  );
}
