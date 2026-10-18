import { useAnnouncements } from '@/api/hooks';
import { AdminActions, AddButton, PageHeader, PinMark } from '@/components/ItemParts';
import { QueryState } from '@/components/Filters';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate } from '@/utils/date';

export default function Announcements() {
  usePageTitle('Announcements');
  const query = useAnnouncements();
  const items = query.data ?? [];
  return (
    <>
      <PageHeader emoji="📢" title="Announcements" actions={<AddButton type="announcement" label="Post announcement" />} />
      <QueryState query={query}>
        {items.length === 0 ? (
          <EmptyState emoji="📢" title="No announcements" hint="Messages from your teacher will appear here." />
        ) : (
          <ul className="space-y-4">
            {items.map((a) => (
              <li key={a.id}>
                <Card>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <PinMark pinned={a.pinned} />
                    {formatDate(a.createdAt)}
                  </div>
                  <h2 className="mt-1 text-lg font-bold">{a.title}</h2>
                  <p className="mt-1 whitespace-pre-line text-sm">{a.body}</p>
                  <div className="mt-3 flex justify-end">
                    <AdminActions type="announcement" item={a} id={a.id} title={a.title} />
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
