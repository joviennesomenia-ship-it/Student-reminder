import { useMemo, useState } from 'react';
import { usePerformanceTasks } from '@/api/hooks';
import { AdminActions, AddButton, AttachmentList, CalendarButton, CountdownBadge, PageHeader, PinMark, StatusBadge, SubjectChip } from '@/components/ItemParts';
import { FilterBar, FilterSelect, QueryState, SearchBox } from '@/components/Filters';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQueryParam } from '@/hooks/useQueryParam';
import { useSubjectMap } from '@/hooks/useSubjectMap';
import { dueStatus, formatDateTime } from '@/utils/date';

export default function PerformanceTasks() {
  usePageTitle('Performance tasks');
  const query = usePerformanceTasks();
  const now = useNow();
  const { map, subjects } = useSubjectMap();
  const [q, setQ] = useQueryParam('q');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (query.data ?? [])
      .filter((t) => (!subject || t.subjectId === subject) && (!status || dueStatus(t.dueAt, now) === status))
      .filter((t) => !needle || `${t.title} ${t.description}`.toLowerCase().includes(needle))
      .sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : a.dueAt.localeCompare(b.dueAt)));
  }, [query.data, q, subject, status, now]);

  return (
    <>
      <PageHeader emoji="🎯" title="Performance tasks" subtitle="Bigger projects and presentations, with their rubrics." actions={<AddButton type="performanceTask" label="Add performance task" />} />
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search performance tasks" />
        <FilterSelect label="Subject" value={subject} onChange={setSubject} options={[{ value: '', label: 'All subjects' }, ...subjects.map((s) => ({ value: s.id, label: `${s.emoji} ${s.name}` }))]} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'Any status' }, { value: 'Upcoming', label: 'Upcoming' }, { value: 'Due Soon', label: 'Due Soon' }, { value: 'Overdue', label: 'Overdue' }]} />
      </FilterBar>
      <QueryState query={query}>
        {items.length === 0 ? (
          <EmptyState emoji="🎯" title={(query.data?.length ?? 0) === 0 ? 'No performance tasks yet' : 'Nothing matches these filters'} hint="Projects with rubrics will appear here." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((t) => (
              <li key={t.id}>
                <Card className="h-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <SubjectChip subject={map.get(t.subjectId)} />
                    <StatusBadge status={dueStatus(t.dueAt, now)} />
                    <CountdownBadge dueAt={t.dueAt} now={now} />
                    <PinMark pinned={t.pinned} />
                  </div>
                  <h2 className="mt-3 text-lg font-bold">{t.title}</h2>
                  <p className="mt-0.5 text-sm text-muted">Due {formatDateTime(t.dueAt)}</p>
                  {t.description && <p className="mt-2 whitespace-pre-line text-sm">{t.description}</p>}
                  {(t.rubricText || t.rubricUrl) && (
                    <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
                      <p className="font-semibold">📏 Rubric</p>
                      {t.rubricText && <p className="mt-1 whitespace-pre-line">{t.rubricText}</p>}
                      {t.rubricUrl && (
                        <a href={t.rubricUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-medium text-primary hover:underline">
                          🔗 Open rubric
                        </a>
                      )}
                    </div>
                  )}
                  <AttachmentList attachments={t.attachments} />
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3">
                    <CalendarButton item={{ id: t.id, kind: 'performanceTask', title: t.title, start: new Date(t.dueAt), end: new Date(new Date(t.dueAt).getTime() + 30 * 60_000), description: t.description }} label="📅 Calendar" />
                    <AdminActions type="performanceTask" item={t} id={t.id} title={t.title} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </>
  );
}
