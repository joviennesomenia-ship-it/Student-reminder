import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAnnouncements, useEvents, useReviewers } from '@/api/hooks';
import { CountdownBadge, PinMark, SubjectChip } from '@/components/ItemParts';
import { HeroCarousel, type Slide } from '@/components/HeroCarousel';
import { Card } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { siteConfig } from '@/config';
import { useDueItems } from '@/hooks/useDueItems';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSubjectMap } from '@/hooks/useSubjectMap';
import { formatDate, formatLongDate, formatShortDate, formatTime } from '@/utils/date';

function Stat({ emoji, value, label, to }: { emoji: string; value: number | string; label: string; to: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl2 border border-border bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl" aria-hidden="true">{emoji}</span>
      <span>
        <span className="block text-3xl font-extrabold leading-none text-primary">{value}</span>
        <span className="mt-1 block text-sm text-muted">{label}</span>
      </span>
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 border-l-4 border-accent pl-3 text-xl font-extrabold">{children}</h2>;
}

export default function Dashboard() {
  usePageTitle();
  const now = useNow();
  const { map } = useSubjectMap();
  const { due, overdue } = useDueItems(now, 7);
  const announcements = useAnnouncements();
  const events = useEvents();
  const reviewers = useReviewers();

  const upcomingEvents = (events.data ?? []).filter((e) => new Date(e.endsAt) >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const newReviewers = (reviewers.data ?? []).filter((r) => now.getTime() - new Date(r.createdAt).getTime() < 7 * 86_400_000);
  const loading = announcements.isLoading || events.isLoading;
  const path = (kind: 'task' | 'performanceTask') => (kind === 'task' ? '/tasks' : '/performance-tasks');

  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = [
      {
        key: 'welcome',
        kicker: formatLongDate(now),
        title: 'Welcome back!',
        highlight: siteConfig.classSection,
        body: 'Everything for class in one place: tasks, reviewers, events and more.',
        cta: { label: 'See my tasks', to: '/tasks' },
        tiles: ['🎓', '📚', '✏️'],
      },
    ];
    const list = announcements.data ?? [];
    const featured = (list.some((a) => a.pinned) ? list.filter((a) => a.pinned) : list).slice(0, 3);
    for (const a of featured) {
      out.push({
        key: `a${a.id}`,
        kicker: a.pinned ? '📌 Pinned announcement' : '📢 Announcement',
        title: a.title,
        body: a.body.length > 180 ? `${a.body.slice(0, 180)}...` : a.body,
        cta: { label: 'Read more', to: '/announcements' },
        tiles: ['📢', '💬', '🔔'],
      });
    }
    const count = due.length + overdue.length;
    out.push(
      count > 0
        ? {
            key: 'due',
            kicker: '⏰ Heads up',
            title: `${count} ${count === 1 ? 'item' : 'items'}`,
            highlight: overdue.length > 0 ? `${overdue.length} overdue!` : 'Due this week!',
            body: [...overdue, ...due].slice(0, 2).map((d) => d.title).join(' · '),
            cta: { label: 'View tasks', to: '/tasks' },
            tiles: ['📋', '⏰', '✅'],
          }
        : {
            key: 'due',
            kicker: '✅ Nothing due this week',
            title: 'All caught up!',
            body: 'Great work. Check the reviewers to get ahead.',
            cta: { label: 'Open reviewers', to: '/reviewers' },
            tiles: ['🎉', '🌟', '📚'],
          },
    );
    const next = upcomingEvents[0];
    if (next) {
      out.push({
        key: 'event',
        kicker: '🎉 Coming up',
        title: next.title,
        highlight: formatShortDate(next.startsAt),
        body: `${formatTime(next.startsAt)}${next.location ? ` · ${next.location}` : ''}`,
        cta: { label: 'See events', to: '/events' },
        tiles: ['🗓️', '🎉', '📍'],
      });
    }
    return out;
  }, [now, announcements.data, due, overdue, upcomingEvents]);

  return (
    <div className="space-y-8">
      <HeroCarousel slides={slides} />

      <section aria-label="At a glance" className="grid gap-3 sm:grid-cols-3">
        <Stat emoji="📋" value={due.length} label="due this week" to="/tasks" />
        <Stat emoji="🎉" value={upcomingEvents.length} label="upcoming events" to="/events" />
        <Stat emoji="📚" value={newReviewers.length} label="new reviewers" to="/reviewers" />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="Due soon">
          <SectionTitle>⏰ Due soon</SectionTitle>
          {overdue.length > 0 && (
            <ul className="mb-3 space-y-2">
              {overdue.map((i) => (
                <li key={`${i.kind}${i.id}`}>
                  <Link to={path(i.kind)} className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-accent">{i.kind === 'task' ? '📋' : '🎯'} {i.title}</span>
                      <SubjectChip subject={map.get(i.subjectId)} />
                    </span>
                    <CountdownBadge dueAt={i.dueAt} now={now} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {loading ? (
            <Skeleton className="h-28" />
          ) : due.length === 0 && overdue.length === 0 ? (
            <EmptyState emoji="🎉" title="You're all caught up" hint="Nothing is due in the next 7 days." />
          ) : (
            <ul className="space-y-2">
              {due.map((i) => (
                <li key={`${i.kind}${i.id}`}>
                  <Link to={path(i.kind)} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{i.kind === 'task' ? '📋' : '🎯'} {i.title}</span>
                      <SubjectChip subject={map.get(i.subjectId)} />
                    </span>
                    <CountdownBadge dueAt={i.dueAt} now={now} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Upcoming events">
          <SectionTitle>🎉 Upcoming events</SectionTitle>
          {events.isLoading ? (
            <Skeleton className="h-28" />
          ) : upcomingEvents.length === 0 ? (
            <EmptyState emoji="🗓️" title="No upcoming events" />
          ) : (
            <ul className="space-y-2">
              {upcomingEvents.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <Card className="!p-4 transition hover:-translate-y-0.5">
                    <p className="font-bold">{e.title} <PinMark pinned={e.pinned} /></p>
                    <p className="text-sm text-muted">🗓️ {formatDate(e.startsAt)}, {formatTime(e.startsAt)}{e.location ? ` · 📍 ${e.location}` : ''}</p>
                  </Card>
                </li>
              ))}
              <li><Link to="/events" className="text-sm font-bold text-primary hover:underline">See all events →</Link></li>
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
