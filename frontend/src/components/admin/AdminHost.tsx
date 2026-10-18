import { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ENDPOINTS, useAnyList, useAttachmentMutations, useSave, useSubjects, type EntityKey } from '@/api/hooks';
import { useAdminForm } from '@/store/admin';
import { toast } from '@/store/ui';
import type { Attachment } from '@/types';
import { Button } from '../ui/Button';
import { Field, Select, TextArea, TextInput, controlClass } from '../ui/Fields';
import { Modal } from '../ui/Modal';
import { AttachmentManager, PendingAttachments, type Pending } from './AttachmentManager';
import { ENTITY_CONFIG, type FieldDef, type Values } from './formConfigs';

const PRIORITIES = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

function idOf(item: object | null): string | undefined {
  const id = item ? (item as Record<string, unknown>)['id'] : undefined;
  return typeof id === 'string' ? id : undefined;
}

function EntityForm({ type, item, onDone }: { type: EntityKey; item: object | null; onDone: () => void }) {
  const config = ENTITY_CONFIG[type];
  const subjects = useSubjects();
  const save = useSave(type);
  const [savedId, setSavedId] = useState<string | undefined>(idOf(item));
  // Files and links chosen while adding a new item; uploaded right after it is saved.
  const [pending, setPending] = useState<Pending>({ files: [], links: [] });
  const [finishing, setFinishing] = useState(false);
  const attach = useAttachmentMutations(config.attachmentOwner ?? 'TASK');
  const list = useAnyList(type);

  const initial = useMemo<Values>(() => (item ? config.fromItem(item) : config.defaults), [item, config]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ defaultValues: initial, resolver: zodResolver(config.schema) as Resolver<Values> });

  const subjectCount = subjects.data?.length ?? 0;
  // Re-apply values once the subject list arrives so the subject dropdown shows the saved choice.
  useEffect(() => reset(initial), [initial, reset, subjectCount]);

  const subjectOptions = [
    { value: '', label: subjects.data?.length ? 'Choose a subject...' : 'Add a subject first (Admin panel)' },
    ...(subjects.data ?? []).map((s) => ({ value: s.id, label: `${s.emoji} ${s.name}` })),
  ];

  const current = list.data?.find((x) => idOf(x) === savedId);
  const attachments = ((current as Record<string, unknown> | undefined)?.['attachments'] as Attachment[] | undefined) ?? [];

  const uploadPending = async (ownerId: string): Promise<number> => {
    let failed = 0;
    for (const file of pending.files) {
      try {
        await attach.upload.mutateAsync({ ownerId, file });
      } catch {
        failed++; // the mutation already showed the reason
      }
    }
    for (const link of pending.links) {
      try {
        await attach.addLink.mutateAsync({ ownerId, name: link.name, url: link.url });
      } catch {
        failed++;
      }
    }
    return failed;
  };

  const onSubmit = handleSubmit((values) => {
    save.mutate(
      { id: savedId, data: config.toPayload(values) },
      {
        onSuccess: async (saved) => {
          const isNew = !savedId;
          if (!config.attachmentOwner || !isNew || pending.files.length + pending.links.length === 0) {
            toast.success(isNew ? `Added ${config.title}` : 'Changes saved');
            onDone();
            return;
          }
          setSavedId(saved.id);
          setFinishing(true);
          const failed = await uploadPending(saved.id);
          setFinishing(false);
          setPending({ files: [], links: [] });
          if (failed === 0) {
            toast.success(`Added ${config.title} with its files and links`);
            onDone();
          } else {
            toast.error(`The ${config.title} was saved, but ${failed} file or link did not upload. Add it again below.`);
          }
        },
        onError: (e) => toast.error(e.message),
      },
    );
  });

  const renderField = (f: FieldDef) => {
    const error = errors[f.name]?.message as string | undefined;
    switch (f.kind) {
      case 'textarea':
        return <TextArea key={f.name} label={f.label} error={error} {...register(f.name)} />;
      case 'select':
        return (
          <Select
            key={f.name}
            label={f.label}
            error={error}
            options={f.options === 'subjects' ? subjectOptions : PRIORITIES}
            {...register(f.name)}
          />
        );
      case 'checkbox':
        return (
          <label key={f.name} className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--color-primary))]" {...register(f.name)} />
            {f.label}
          </label>
        );
      case 'color':
        return (
          <Field key={f.name} label={f.label} error={error}>
            <input type="color" className={`${controlClass} h-10 cursor-pointer p-1`} {...register(f.name)} />
          </Field>
        );
      case 'datetime':
        return <TextInput key={f.name} type="datetime-local" label={f.label} error={error} {...register(f.name)} />;
      case 'url':
        return <TextInput key={f.name} type="url" label={f.label} placeholder={f.placeholder} error={error} {...register(f.name)} />;
      default:
        return <TextInput key={f.name} label={f.label} placeholder={f.placeholder} hint={f.hint} error={error} {...register(f.name)} />;
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {config.fields.map(renderField)}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onDone}>
            {savedId && !item ? 'Done' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={save.isPending || finishing}>
            {finishing ? 'Uploading files...' : save.isPending ? 'Saving...' : savedId ? 'Save changes' : `Add ${config.title}`}
          </Button>
        </div>
      </form>
      {config.attachmentOwner && savedId && (
        <AttachmentManager owner={config.attachmentOwner} ownerId={savedId} attachments={attachments} />
      )}
      {config.attachmentOwner && !savedId && <PendingAttachments pending={pending} onChange={setPending} />}
    </>
  );
}

export function AdminHost() {
  const form = useAdminForm((s) => s.form);
  const close = useAdminForm((s) => s.close);
  if (!form) return null;
  const type = ENTITY_FROM_KEY(form.type);
  const verb = form.item ? 'Edit' : 'Add';
  return (
    <Modal open onClose={close} title={`${verb} ${ENTITY_CONFIG[type].title}`} wide>
      <EntityForm key={`${form.type}-${idOf(form.item) ?? 'new'}`} type={type} item={form.item} onDone={close} />
    </Modal>
  );
}

const ENTITY_FROM_KEY = (t: string): EntityKey => (t in ENDPOINTS ? (t as EntityKey) : 'task');
