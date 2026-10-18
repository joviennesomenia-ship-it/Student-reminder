import { useMemo } from 'react';
import { useEvents, usePerformanceTasks, useTasks } from '@/api/hooks';
import type { IcsItem } from '@/utils/ics';

export type CalKind = 'task' | 'performanceTask' | 'event';

export interface CalItem {
  id: string;
  kind: CalKind;
  title: string;
  start: Date;
  end: Date;
  subjectId?: string;
  description: string;
  location?: string;
}

export const KIND_LABEL: Record<CalKind, string> = {
  task: '📋 Task',
  performanceTask: '🎯 Performance task',
  event: '🎉 Event',
};

export function toIcs(item: CalItem): IcsItem {
  return {
    uid: `${item.kind}-${item.id}`,
    title: `${KIND_LABEL[item.kind].split(' ')[0]} ${item.title}`,
    start: item.start,
    end: item.end,
    description: item.description,
    ...(item.location ? { location: item.location } : {}),
  };
}

export function useCalendarItems(): { items: CalItem[]; isLoading: boolean; isError: boolean } {
  const tasks = useTasks();
  const pts = usePerformanceTasks();
  const events = useEvents();
  const items = useMemo<CalItem[]>(() => {
    const dueEnd = (d: Date): Date => new Date(d.getTime() + 30 * 60_000);
    return [
      ...(tasks.data ?? []).map((t) => {
        const start = new Date(t.dueAt);
        return { id: t.id, kind: 'task' as const, title: t.title, start, end: dueEnd(start), subjectId: t.subjectId, description: t.description };
      }),
      ...(pts.data ?? []).map((t) => {
        const start = new Date(t.dueAt);
        return { id: t.id, kind: 'performanceTask' as const, title: t.title, start, end: dueEnd(start), subjectId: t.subjectId, description: t.description };
      }),
      ...(events.data ?? []).map((e) => ({
        id: e.id,
        kind: 'event' as const,
        title: e.title,
        start: new Date(e.startsAt),
        end: new Date(e.endsAt),
        description: e.description,
        location: e.location,
      })),
    ].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [tasks.data, pts.data, events.data]);
  return {
    items,
    isLoading: tasks.isLoading || pts.isLoading || events.isLoading,
    isError: tasks.isError || pts.isError || events.isError,
  };
}
