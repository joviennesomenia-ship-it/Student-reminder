import { useMemo, useState } from 'react';
import { CalendarButton, SubjectChip } from '@/components/ItemParts';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { KIND_LABEL, toIcs, useCalendarItems, type CalItem, type CalKind } from '@/hooks/useCalendarItems';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSubjectMap } from '@/hooks/useSubjectMap';
import { dayDiff, dayKey, formatDate, formatDateTime, formatMonthYear, formatShortDate, formatTime, keyFromYMD, startOfWeekKey } from '@/utils/date';
import { downloadIcs } from '@/utils/ics';
import { PageHeader } from '@/components/ItemParts';

type View = 'month' | 'week' | 'agenda';
type ColorBy = 'type' | 'subject';

const TYPE_COLOR: Record<CalKind, string> = {
  task: 'rgb(var(--color-primary))',
  performanceTask: 'rgb(var(--color-accent))',
  event: '#0f766e',
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parts = (key: string): [number, number, number] => {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return [y, m - 1, d];
};
const shift = (key: string, days: number): string => {
  const [y, m, d] = parts(key);
  return keyFromYMD(y, m, d + days);
};
const keyDate = (key: string): Date => {
  const [y, m, d] = parts(key);
  return new Date(Date.UTC(y, m, d, 12));
};

export default function Calendar() {
  usePageTitle('Calendar');
  const { items, isLoading, isError } = useCalendarItems();
  const { map } = useSubjectMap();
  const todayKey = dayKey(new Date());
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(todayKey);
  const [colorBy, setColorBy] = useState<ColorBy>('type');
  const [selected, setSelected] = useState<{ day?: string; item?: CalItem } | null>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    for (const it of items) {
      const first = dayKey(it.start);
      const span = Math.min(Math.max(dayDiff(first, dayKey(it.end)), 0), 30);
      for (let i = 0; i <= span; i++) {
        const k = shift(first, i);
        m.set(k, [...(m.get(k) ?? []), it]);
      }
    }
    return m;
  }, [items]);

  const colorOf = (it: CalItem): string =>
    colorBy === 'subject' && it.subjectId ? (map.get(it.subjectId)?.color ?? TYPE_COLOR[it.kind]) : TYPE_COLOR[it.kind];

  const [cy, cm] = parts(cursor);
  const monthStart = keyFromYMD(cy, cm, 1);
  const gridStart = startOfWeekKey(monthStart);
  const weekStart = startOfWeekKey(cursor);

  const move = (dir: -1 | 1) => setCursor(view === 'month' ? keyFromYMD(cy, cm + dir, 1) : shift(cursor, dir * 7));
  const title =
    view === 'month' ? formatMonthYear(cy, cm) : view === 'week' ? `${formatShortDate(keyDate(weekStart))} to ${formatShortDate(keyDate(shift(weekStart, 6)))}` : 'Next 60 days';

  const chip = (it: CalItem, key: string) => (
    <button
      key={key}
      onClick={() => setSelected({ item: it })}
      className="block w-full truncate rounded border-l-4 bg-surface-2 px-1.5 py-0.5 text-left text-xs font-medium hover:bg-primary/10"
      style={{ borderLeftColor: colorOf(it) }}
      title={it.title}
    >
      {it.title}
    </button>
  );

  const dayItems = selected?.day ? (byDay.get(selected.day) ?? []) : [];
  const legend =
    colorBy === 'type'
      ? (Object.keys(TYPE_COLOR) as CalKind[]).map((k) => ({ label: KIND_LABEL[k], color: TYPE_COLOR[k] }))
      : [...map.values()].map((s) => ({ label: `${s.emoji} ${s.name}`, color: s.color }));

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? 'bg-primary text-on-primary' : 'text-muted hover:bg-surface-2'}`;

  const agendaDays = useMemo(() => {
    const out: { key: string; list: CalItem[] }[] = [];
    for (let i = 0; i < 60; i++) {
      const k = shift(todayKey, i);
      const list = (byDay.get(k) ?? []).filter((it) => dayKey(it.start) === k || i === 0);
      if (list.length) out.push({ key: k, list });
    }
    return out;
  }, [byDay, todayKey]);

  return (
    <>
      <PageHeader
        emoji="🗓️"
        title="Calendar"
        subtitle="Tasks, performance tasks and events in one place."
        actions={
          <Button variant="secondary" disabled={items.length === 0} onClick={() => downloadIcs(items.map(toIcs), 'class-calendar')}>
            📅 Add everything to my calendar
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1" role="tablist" aria-label="Calendar view">
          {(['month', 'week', 'agenda'] as View[]).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={tabClass(view === v)} onClick={() => setView(v)}>
              {v === 'month' ? 'Month' : v === 'week' ? 'Week' : 'Agenda'}
            </button>
          ))}
        </div>
        {view !== 'agenda' && (
          <div className="flex items-center gap-1">
            <Button small variant="secondary" onClick={() => move(-1)} aria-label="Previous">‹</Button>
            <Button small variant="secondary" onClick={() => setCursor(todayKey)}>Today</Button>
            <Button small variant="secondary" onClick={() => move(1)} aria-label="Next">›</Button>
          </div>
        )}
        <h2 className="text-lg font-bold" aria-live="polite">{title}</h2>
        <label className="ml-auto flex items-center gap-2 text-sm">
          Color by
          <select value={colorBy} onChange={(e) => setColorBy(e.target.value as ColorBy)} className="rounded-lg border border-border bg-surface px-2 py-1.5">
            <option value="type">Type</option>
            <option value="subject">Subject</option>
          </select>
        </label>
      </div>

      {isError ? (
        <ErrorState />
      ) : isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          {view === 'month' && (
            <div className="overflow-hidden rounded-xl2 border border-border bg-surface shadow-card">
              <div className="grid grid-cols-7 border-b border-border bg-surface-2 text-center text-xs font-semibold text-muted">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: 42 }, (_, i) => {
                  const k = shift(gridStart, i);
                  const [, km, kd] = parts(k);
                  const list = byDay.get(k) ?? [];
                  const inMonth = km === cm;
                  return (
                    <div key={k} className={`min-h-[5.5rem] border-b border-r border-border p-1 sm:min-h-[7rem] ${inMonth ? '' : 'bg-surface-2/60 text-muted'}`}>
                      <button
                        onClick={() => setSelected({ day: k })}
                        aria-label={`${formatDate(keyDate(k))}, ${list.length} items`}
                        className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold hover:bg-primary/10 ${k === todayKey ? 'bg-primary text-on-primary hover:bg-primary' : ''}`}
                      >
                        {kd}
                      </button>
                      <div className="space-y-0.5">
                        {list.slice(0, 2).map((it) => chip(it, `${it.kind}${it.id}`))}
                        {list.length > 2 && (
                          <button onClick={() => setSelected({ day: k })} className="px-1 text-xs font-semibold text-primary">
                            +{list.length - 2} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div className="grid gap-2 sm:grid-cols-7">
              {Array.from({ length: 7 }, (_, i) => {
                const k = shift(weekStart, i);
                const list = byDay.get(k) ?? [];
                return (
                  <div key={k} className={`rounded-xl border bg-surface p-2 ${k === todayKey ? 'border-primary' : 'border-border'}`}>
                    <button onClick={() => setSelected({ day: k })} className="mb-2 w-full text-left text-sm font-bold">
                      {WEEKDAYS[i]} {parts(k)[2]}
                    </button>
                    <div className="space-y-1">
                      {list.length === 0 && <p className="text-xs text-muted">Nothing</p>}
                      {list.map((it) => chip(it, `${it.kind}${it.id}`))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'agenda' && (
            <div className="space-y-4">
              {agendaDays.length === 0 && <p className="rounded-xl2 border border-dashed border-border bg-surface p-8 text-center text-muted">Nothing scheduled in the next 60 days. 🎉</p>}
              {agendaDays.map(({ key, list }) => (
                <section key={key}>
                  <h3 className="mb-1 text-sm font-bold text-muted">{key === todayKey ? 'Today, ' : ''}{formatDate(keyDate(key))}</h3>
                  <ul className="space-y-1.5">
                    {list.map((it) => (
                      <li key={`${it.kind}${it.id}`}>
                        <button onClick={() => setSelected({ item: it })} className="flex w-full items-center gap-3 rounded-xl border border-border border-l-4 bg-surface px-3 py-2 text-left hover:border-primary" style={{ borderLeftColor: colorOf(it) }}>
                          <span className="w-16 shrink-0 text-xs text-muted">{formatTime(it.start)}</span>
                          <span className="min-w-0 flex-1 truncate font-semibold">{it.title}</span>
                          <span className="hidden text-xs text-muted sm:inline">{KIND_LABEL[it.kind]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
            {legend.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} aria-hidden="true" />
                {l.label}
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.item ? selected.item.title : selected?.day ? formatDate(keyDate(selected.day)) : ''}
      >
        {selected?.item && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold">{KIND_LABEL[selected.item.kind]}</p>
            <SubjectChip subject={selected.item.subjectId ? map.get(selected.item.subjectId) : undefined} />
            <p>🗓️ {selected.item.kind === 'event' ? `${formatDateTime(selected.item.start)} to ${formatTime(selected.item.end)}` : `Due ${formatDateTime(selected.item.start)}`}</p>
            {selected.item.location && <p>📍 {selected.item.location}</p>}
            {selected.item.description && <p className="whitespace-pre-line text-muted">{selected.item.description}</p>}
            <CalendarButton item={selected.item} />
          </div>
        )}
        {selected?.day && (
          <ul className="space-y-2">
            {dayItems.length === 0 && <li className="text-sm text-muted">Nothing scheduled this day.</li>}
            {dayItems.map((it) => (
              <li key={`${it.kind}${it.id}`}>
                <button onClick={() => setSelected({ item: it })} className="flex w-full items-center gap-3 rounded-lg border border-border border-l-4 px-3 py-2 text-left hover:bg-surface-2" style={{ borderLeftColor: colorOf(it) }}>
                  <span className="text-xs text-muted">{formatTime(it.start)}</span>
                  <span className="flex-1 font-semibold">{it.title}</span>
                  <span className="text-xs text-muted">{KIND_LABEL[it.kind]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
