import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIsAdmin, useReviewers } from '@/api/hooks';
import { AdminActions, AddButton, AttachmentList, PageHeader, PinMark, SubjectChip } from '@/components/ItemParts';
import { FilterBar, QueryState, SearchBox } from '@/components/Filters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQueryParam } from '@/hooks/useQueryParam';
import { useSubjectMap } from '@/hooks/useSubjectMap';
import { formatShortDate } from '@/utils/date';

export default function Reviewers() {
  usePageTitle('Reviewers');
  const query = useReviewers();
  const isAdmin = useIsAdmin();
  const { map, subjects } = useSubjectMap();
  const [q, setQ] = useQueryParam('q');
  const [subject, setSubject] = useState('');

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (query.data ?? [])
      .filter((r) => !subject || r.subjectId === subject)
      .filter((r) => !needle || `${r.title} ${r.description} ${r.tag}`.toLowerCase().includes(needle));
  }, [query.data, q, subject]);

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    (query.data ?? []).forEach((r) => c.set(r.subjectId, (c.get(r.subjectId) ?? 0) + 1));
    return c;
  }, [query.data]);

  const tab = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold ${active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface hover:border-primary'}`;

  return (
    <>
      <PageHeader
        emoji="📚"
        title="Reviewers"
        subtitle="Study materials by subject. Open files in a new tab or download them."
        actions={
          <>
            {isAdmin && (
              <Link to="/admin?tab=subjects">
                <Button variant="secondary">🏷️ Manage subjects</Button>
              </Link>
            )}
            <AddButton type="reviewer" label="Add reviewer" />
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Subjects">
        <button role="tab" aria-selected={subject === ''} className={tab(subject === '')} onClick={() => setSubject('')}>
          All ({query.data?.length ?? 0})
        </button>
        {subjects.map((s) => (
          <button key={s.id} role="tab" aria-selected={subject === s.id} className={tab(subject === s.id)} onClick={() => setSubject(s.id)}>
            {s.emoji} {s.name} ({counts.get(s.id) ?? 0})
          </button>
        ))}
      </div>
      <FilterBar>
        <SearchBox value={q} onChange={setQ} placeholder="Search reviewers" />
      </FilterBar>
      <QueryState query={query}>
        {items.length === 0 ? (
          <EmptyState emoji="📚" title={(query.data?.length ?? 0) === 0 ? 'No reviewers yet' : 'Nothing matches'} hint="Study files and links from your teacher will show up here." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((r) => {
              const s = map.get(r.subjectId);
              return (
                <li key={r.id}>
                  <Card className="h-full" style={s ? { borderTop: `4px solid ${s.color}` } : undefined}>
                    <div className="flex flex-wrap items-center gap-2">
                      <SubjectChip subject={s} />
                      {r.tag && <Badge tone="ok">{r.tag}</Badge>}
                      <PinMark pinned={r.pinned} />
                      <span className="ml-auto text-xs text-muted">Added {formatShortDate(r.createdAt)}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold">{r.title}</h2>
                    {r.description && <p className="mt-1 whitespace-pre-line text-sm">{r.description}</p>}
                    <AttachmentList attachments={r.attachments} />
                    <div className="mt-4 flex justify-end border-t border-border pt-3">
                      <AdminActions type="reviewer" item={r} id={r.id} title={r.title} />
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
