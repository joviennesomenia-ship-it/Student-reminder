import { useAttachmentMutations } from '@/api/hooks';
import { toast } from '@/store/ui';
import type { Attachment, AttachmentOwner } from '@/types';
import { fileIcon, formatSize, linkIcon } from '@/utils/files';
import { Button } from '../ui/Button';
import { AttachControls } from './AttachControls';

export interface PendingLink {
  name: string;
  url: string;
}
export interface Pending {
  files: File[];
  links: PendingLink[];
}

const Row = ({ icon, name, extra, onRemove }: { icon: string; name: string; extra?: string; onRemove: () => void }) => (
  <li className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
    <span aria-hidden="true">{icon}</span>
    <span className="min-w-0 flex-1 truncate">{name}</span>
    {extra && <span className="text-xs text-muted">{extra}</span>}
    <Button small variant="ghost" aria-label={`Remove ${name}`} onClick={onRemove}>
      Remove
    </Button>
  </li>
);

/** Files and links for an item that does not exist yet: they are uploaded when the item is saved. */
export function PendingAttachments({ pending, onChange }: { pending: Pending; onChange: (p: Pending) => void }) {
  return (
    <section className="mt-6 rounded-xl border border-border bg-surface-2 p-4" aria-label="Files and links">
      <h3 className="font-bold">📎 Files and 🔗 links <span className="text-sm font-normal text-muted">(optional)</span></h3>
      <ul className="mt-3 space-y-1.5">
        {pending.files.map((f, i) => (
          <Row key={`f${i}${f.name}`} icon={fileIcon(f.type, f.name)} name={f.name} extra={formatSize(f.size)} onRemove={() => onChange({ ...pending, files: pending.files.filter((_, n) => n !== i) })} />
        ))}
        {pending.links.map((l, i) => (
          <Row key={`l${i}${l.url}`} icon={linkIcon(l.url)} name={l.name} onRemove={() => onChange({ ...pending, links: pending.links.filter((_, n) => n !== i) })} />
        ))}
        {pending.files.length + pending.links.length === 0 && <li className="text-sm text-muted">Nothing chosen yet. They upload when you press the Add button below.</li>}
      </ul>
      <AttachControls
        onFiles={(files) => onChange({ ...pending, files: [...pending.files, ...files] })}
        onLink={(name, url) => onChange({ ...pending, links: [...pending.links, { name, url }] })}
      />
    </section>
  );
}

interface Props {
  owner: AttachmentOwner;
  ownerId: string;
  attachments: Attachment[];
}

/** Files and links for an item that already exists: each change is saved immediately. */
export function AttachmentManager({ owner, ownerId, attachments }: Props) {
  const { addLink, upload, remove } = useAttachmentMutations(owner);
  const busy = upload.isPending || addLink.isPending;

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface-2 p-4" aria-label="Files and links">
      <h3 className="font-bold">📎 Files and 🔗 links</h3>
      <ul className="mt-3 space-y-1.5">
        {attachments.length === 0 && <li className="text-sm text-muted">Nothing attached yet.</li>}
        {attachments.map((a) => (
          <Row
            key={a.id}
            icon={a.kind === 'file' ? fileIcon(a.mimeType, a.name) : linkIcon(a.url)}
            name={a.name}
            {...(a.kind === 'file' ? { extra: formatSize(a.size) } : {})}
            onRemove={() => remove.mutate(a.id)}
          />
        ))}
      </ul>
      {busy && <p className="mt-2 text-sm font-semibold text-primary" role="status">Uploading...</p>}
      <AttachControls
        disabled={busy}
        onFiles={async (files) => {
          for (const file of files) {
            try {
              await upload.mutateAsync({ ownerId, file });
              toast.success(`Uploaded ${file.name}`);
            } catch {
              /* the mutation already showed the error message */
            }
          }
        }}
        onLink={(name, url) => addLink.mutate({ ownerId, name, url }, { onSuccess: () => toast.success('Link added') })}
      />
    </section>
  );
}
