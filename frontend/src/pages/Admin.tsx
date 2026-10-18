import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ENDPOINTS, useAnyList, useIsAdmin, useLogin, useMe, usePatch, useRemove, type EntityKey } from '@/api/hooks';
import { PageHeader } from '@/components/ItemParts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/Fields';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminForm, useConfirm } from '@/store/admin';
import { toast } from '@/store/ui';
import { formatDateTime } from '@/utils/date';

const TABS: { key: EntityKey; slug: string; label: string; emoji: string }[] = [
  { key: 'subject', slug: 'subjects', label: 'Subjects', emoji: '🏷️' },
  { key: 'task', slug: 'tasks', label: 'Tasks', emoji: '📋' },
  { key: 'performanceTask', slug: 'performance-tasks', label: 'Performance tasks', emoji: '🎯' },
  { key: 'reviewer', slug: 'reviewers', label: 'Reviewers', emoji: '📚' },
  { key: 'event', slug: 'events', label: 'Events', emoji: '🎉' },
  { key: 'announcement', slug: 'announcements', label: 'Announcements', emoji: '📢' },
];

const field = (o: object, k: string): string => {
  const v = (o as Record<string, unknown>)[k];
  return typeof v === 'string' ? v : '';
};

function rowText(type: EntityKey, item: object): { title: string; meta: string } {
  switch (type) {
    case 'subject':
      return { title: `${field(item, 'emoji')} ${field(item, 'name')}`, meta: field(item, 'color') };
    case 'task':
    case 'performanceTask':
      return { title: field(item, 'title'), meta: `Due ${formatDateTime(field(item, 'dueAt'))}` };
    case 'event':
      return { title: field(item, 'title'), meta: formatDateTime(field(item, 'startsAt')) };
    case 'reviewer':
      return { title: field(item, 'title'), meta: field(item, 'tag') };
    case 'announcement':
      return { title: field(item, 'title'), meta: formatDateTime(field(item, 'createdAt')) };
  }
}

function LoginForm() {
  const login = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    login.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => toast.success('Welcome back'),
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <h1 className="text-2xl font-bold">🔐 Teacher login</h1>
        <p className="mt-1 text-sm text-muted">Only the teacher can add or change content.</p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <TextInput label="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <TextInput label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && (
            <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={login.isPending || !username || !password}>
            {login.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">Back to the site</Link>
      </Card>
    </div>
  );
}

function AdminTab({ type, label, emoji }: { type: EntityKey; label: string; emoji: string }) {
  const query = useAnyList(type);
  const open = useAdminForm((s) => s.open);
  const ask = useConfirm((s) => s.ask);
  const remove = useRemove(type);
  const patch = usePatch(type);
  const items = query.data ?? [];
  const canPin = type !== 'subject';
  const singular = label.toLowerCase().replace(/s$/, '');

  return (
    <section aria-label={label}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{emoji} {label} ({items.length})</h2>
        <Button onClick={() => open(type)}>＋ Add {singular}</Button>
      </div>
      {query.isLoading ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <EmptyState emoji={emoji} title={`No ${label.toLowerCase()} yet`} hint="Use the Add button to create the first one." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl2 border border-border bg-surface">
          {items.map((item) => {
            const id = field(item, 'id');
            const { title, meta } = rowText(type, item);
            const pinned = (item as Record<string, unknown>)['pinned'] === true;
            return (
              <li key={id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{pinned && '📌 '}{title}</p>
                  {meta && <p className="text-xs text-muted">{meta}</p>}
                </div>
                {canPin && (
                  <Button small variant="ghost" aria-pressed={pinned} onClick={() => patch.mutate({ id, data: { pinned: !pinned } })}>
                    {pinned ? 'Unpin' : '📌 Pin'}
                  </Button>
                )}
                <Button small variant="secondary" onClick={() => open(type, item)}>✏️ Edit</Button>
                <Button
                  small
                  variant="ghost"
                  onClick={async () => {
                    const extra = type === 'subject' ? ' Everything under this subject (tasks, performance tasks, reviewers) is deleted too.' : ' Its files and links are removed too.';
                    if (await ask(`Delete "${title}"?`, `This cannot be undone.${extra}`)) remove.mutate(id);
                  }}
                >
                  🗑️ Delete
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Admin() {
  usePageTitle('Admin');
  const me = useMe();
  const isAdmin = useIsAdmin();
  const [params, setParams] = useSearchParams();
  const active = TABS.find((t) => t.slug === params.get('tab')) ?? TABS[1] ?? TABS[0];

  if (me.isLoading) return <Skeleton className="mx-auto h-64 max-w-sm" />;
  if (!isAdmin || !active) return <LoginForm />;
  void ENDPOINTS; // keeps the endpoint table imported for the tab keys

  return (
    <>
      <PageHeader emoji="🔐" title="Admin panel" subtitle="Add, edit, pin and delete everything students see." />
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Content type">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === active.key}
            onClick={() => setParams({ tab: t.slug }, { replace: true })}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${t.key === active.key ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface hover:border-primary'}`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      <AdminTab key={active.key} type={active.key} label={active.label} emoji={active.emoji} />
    </>
  );
}
