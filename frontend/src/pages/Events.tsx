import { useMemo, useState } from 'react';
import { useEvents } from '@/api/hooks';
import { AdminActions, AddButton, CalendarButton, PageHeader, PinMark } from '@/components/ItemParts';
import { QueryState } from '@/components/Filters';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQueryParam } from '@/hooks/useQueryParam';
import { dayDiff, dayKey, formatDate, formatTime } from '@/utils/date';
import type { EventItem } from '@/types';

function whenLabel(e: EventItem, now: Date): { label: string; tone: 'urgent' | 'soon' | 'ok' | 'done' } {
  if (new Date(e.endsAt) < now) return { label: 'Finished', tone: 'done' };
  if (new Date(e.startsAt) <= now) return { label: 'Happening now', tone: 'urgent' };
  const days = dayDiff(dayKey(now), dayKey(new Date(e.startsAt)));
  if (days === 0) return { label: 'Today', tone: 'urgent' };
  if (days === 1) return { label: 'Tomorrow', tone: 'urgent' };
  return { label: `In ${days} days`, tone: days <= 3 ? 'soon' : 'ok' };
}

export default function Events() {
  usePageTitle('Events');
  const query = useEvents();
  const now = useNow();
  const [tab, setTab] = useState<'upcoming' | 'archive'>('upcoming');
  const [q] = useQueryParam('q');

  const { upcoming, archive } = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const all = (query.data ?? []).filter((e) => !needle || `${e.title} ${e.description} ${e.location}`.toLowerCase().includes(needle));
    return {
      upcoming: all.filter((e) => new Date(e.endsAt) >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      archive: all.filter((e) => new Date(e.endsAt) < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    };
  }, [query.data, q, now]);

  const shown = tab === 'upcoming' ? upcoming : archive;
  const tabClass = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold ${active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface hover:border-primary'}`;

  return (
    <>
      <PageHeader emoji="🎉" title="Events" subtitle="Class activities, exams and school events." actions={<AddButton type="event" label="Add event" />} />
      <div className="mb-5 flex gap-2" role="tablist">
        <button role="tab" aria-selected={tab === 'upcoming'} className={tabClass(tab === 'upcoming')} onClick={() => setTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button role="tab" aria-selected={tab === 'archive'} className={tabClass(tab === 'archive')} onClick={() => setTab('archive')}>
          Archive ({archive.length})
        </button>
      </div>
      <QueryState query={query}>
        {shown.length === 0 ? (
          <EmptyState emoji={tab === 'upcoming' ? '🗓️' : '📦'} title={tab === 'upcoming' ? 'No upcoming events' : 'The archive is empty'} hint={tab === 'upcoming' ? 'Check back soon.' : 'Past events move here automatically.'} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {shown.map((e) => {
              const w = whenLabel(e, now);
              return (
                <li key={e.id}>
                  <Card className={`h-full ${tab === 'archive' ? 'opacity-80' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={w.tone}>🎉 {w.label}</Badge>
                      <PinMark pinned={e.pinned} />
                    </div>
                    <h2 className="mt-3 text-lg font-bold">{e.title}</h2>
                    <p className="mt-1 text-sm">🗓️ {formatDate(e.startsAt)}</p>
                    <p className="text-sm">🕒 {formatTime(e.startsAt)} to {formatTime(e.endsAt)}</p>
                    {e.location && <p className="text-sm">📍 {e.location}</p>}
                    {e.description && <p className="mt-2 whitespace-pre-line text-sm text-muted">{e.description}</p>}
                    <div className="mt-4 flex flex-wrap justify-end gap-1 border-t border-border pt-3">
                      <CalendarButton item={{ id: e.id, kind: 'event', title: e.title, start: new Date(e.startsAt), end: new Date(e.endsAt), description: e.description, location: e.location }} label="📅 Calendar" />
                      <AdminActions type="event" item={e} id={e.id} title={e.title} />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </QueryState>
    </>
  );
}
