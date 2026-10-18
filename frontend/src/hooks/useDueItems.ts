import { useMemo } from 'react';
import { usePerformanceTasks, useTasks } from '@/api/hooks';
import { useDone } from '@/store/done';
import { dayDiff, dayKey } from '@/utils/date';

export interface DueItem {
  id: string;
  kind: 'task' | 'performanceTask';
  title: string;
  dueAt: string;
  subjectId: string;
}

/** Tasks and performance tasks (not ticked done) due within `withinDays`, plus overdue ones. */
export function useDueItems(now: Date, withinDays: number): { due: DueItem[]; overdue: DueItem[] } {
  const tasks = useTasks();
  const pts = usePerformanceTasks();
  const done = useDone((s) => s.done);
  return useMemo(() => {
    const all: DueItem[] = [
      ...(tasks.data ?? []).map((t) => ({ id: t.id, kind: 'task' as const, title: t.title, dueAt: t.dueAt, subjectId: t.subjectId })),
      ...(pts.data ?? []).map((t) => ({ id: t.id, kind: 'performanceTask' as const, title: t.title, dueAt: t.dueAt, subjectId: t.subjectId })),
    ].filter((i) => !done.includes(i.id));
    const today = dayKey(now);
    const overdue = all.filter((i) => new Date(i.dueAt) < now);
    const due = all
      .filter((i) => new Date(i.dueAt) >= now && dayDiff(today, dayKey(new Date(i.dueAt))) <= withinDays)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    return { due, overdue };
  }, [tasks.data, pts.data, done, now, withinDays]);
}
