import { useMemo, useState } from 'react';
import { useTasks } from '@/api/hooks';
import { AdminActions, AddButton, AttachmentList, CalendarButton, CountdownBadge, DoneToggle, PageHeader, PinMark, PriorityBadge, SubjectChip } from '@/components/ItemParts';
import { FilterBar, FilterSelect, QueryState, SearchBox } from '@/components/Filters';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQueryParam } from '@/hooks/useQueryParam';
import { useSubjectMap } from '@/hooks/useSubjectMap';
import { useDone } from '@/store/done';
import { formatDateTime } from '@/utils/date';
import type { Subject, Task } from '@/types';

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export default function Tasks() {
  usePageTitle('Tasks');
  const query = useTasks();
  const now = useNow();
  const { map, subjects } = useSubjectMap();
  const done = useDone((s) => s.done);
  const [q, setQ] = useQueryParam('q');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('pending');
  const [sort, setSort] = useState('due');

  const tasks = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (query.data ?? [])
      .filter((t) => (!subject || t.subjectId === subject) && (!priority || t.priority === priority))
      .filter((t) => !needle || `${t.title} ${t.description}`.toLowerCase().includes(needle))
      .filter((t) => {
        const isDone = done.includes(t.id);
        if (status === 'done') return isDone;
        if (status === 'overdue') return !isDone && new Date(t.dueAt) < now;
        if (status === 'pending') return !isDone;
        return true;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (sort === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.dueAt.localeCompare(b.dueAt);
        return sort === 'latest' ? b.dueAt.localeCompare(a.dueAt) : a.dueAt.localeCompare(b.dueAt);
      });
  }, [query.data, q, subject, priority, status, sort, done, now]);

  return (
    <>
      <PageHeader emoji="📋" title="Tasks" subtitle="Homework and assignments. Tick ✅ Done for yourself; it is saved only on your device." actions={<AddButton type="task" label="Add task" />} />
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search tasks" />
        <FilterSelect label="Subject" value={subject} onChange={setSubject} options={[{ value: '', label: 'All subjects' }, ...subjects.map((s) => ({ value: s.id, label: `${s.emoji} ${s.name}` }))]} />
        <FilterSelect label="Priority" value={priority} onChange={setPriority} options={[{ value: '', label: 'Any priority' }, { value: 'HIGH', label: 'High' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'LOW', label: 'Low' }]} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: 'pending', label: 'Not done' }, { value: 'overdue', label: 'Overdue' }, { value: 'done', label: '✅ Done' }, { value: 'all', label: 'All' }]} />
        <FilterSelect label="Sort" value={sort} onChange={setSort} options={[{ value: 'due', label: 'Due soonest' }, { value: 'latest', label: 'Due latest' }, { value: 'priority', label: 'Priority' }]} />
      </FilterBar>

      <QueryState query={query}>
        {tasks.length === 0 ? (
          <EmptyState emoji="🎉" title={(query.data?.length ?? 0) === 0 ? 'No tasks yet' : 'Nothing matches these filters'} hint={(query.data?.length ?? 0) === 0 ? 'When your teacher posts a task, it shows up here.' : 'Try clearing a filter or the search box.'} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <TaskCard task={t} now={now} subject={map.get(t.subjectId)} />
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </>
  );
}

function TaskCard({ task, now, subject }: { task: Task; now: Date; subject: Subject | undefined }) {
  const done = useDone((s) => s.done.includes(task.id));
  return (
    <Card className={`h-full ${done ? 'opacity-70' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <SubjectChip subject={subject} />
        <PriorityBadge priority={task.priority} />
        <CountdownBadge dueAt={task.dueAt} now={now} done={done} />
        <PinMark pinned={task.pinned} />
      </div>
      <h2 className={`mt-3 text-lg font-bold ${done ? 'line-through' : ''}`}>{task.title}</h2>
      <p className="mt-0.5 text-sm text-muted">Due {formatDateTime(task.dueAt)}</p>
      {task.description && <p className="mt-2 whitespace-pre-line text-sm">{task.description}</p>}
      <AttachmentList attachments={task.attachments} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <DoneToggle id={task.id} />
        <div className="flex flex-wrap items-center gap-1">
          <CalendarButton item={{ id: task.id, kind: 'task', title: task.title, start: new Date(task.dueAt), end: new Date(new Date(task.dueAt).getTime() + 30 * 60_000), description: task.description }} label="📅 Calendar" />
          <AdminActions type="task" item={task} id={task.id} title={task.title} />
        </div>
      </div>
    </Card>
  );
}
