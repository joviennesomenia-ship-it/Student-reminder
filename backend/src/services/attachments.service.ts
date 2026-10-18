import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import type { OwnerType } from '../schemas.js';
import { checkFile, fixFileName } from './fileValidation.js';
import { getStorage } from './storage/index.js';
import { sanitizeText } from '../lib/sanitize.js';

const publicSelect = {
  id: true,
  ownerType: true,
  ownerId: true,
  kind: true,
  name: true,
  url: true,
  mimeType: true,
  size: true,
  createdAt: true,
} satisfies Prisma.AttachmentSelect;

export type PublicAttachment = Prisma.AttachmentGetPayload<{ select: typeof publicSelect }>;
export type WithAttachments<T> = T & { attachments: PublicAttachment[] };

export async function withAttachments<T extends { id: string }>(
  ownerType: OwnerType,
  rows: T[],
): Promise<WithAttachments<T>[]> {
  if (rows.length === 0) return [];
  const found = await prisma.attachment.findMany({
    where: { ownerType, ownerId: { in: rows.map((r) => r.id) } },
    select: publicSelect,
    orderBy: { createdAt: 'asc' },
  });
  const byOwner = new Map<string, PublicAttachment[]>();
  for (const a of found) byOwner.set(a.ownerId, [...(byOwner.get(a.ownerId) ?? []), a]);
  return rows.map((r) => ({ ...r, attachments: byOwner.get(r.id) ?? [] }));
}

/** Deletes attachment rows and their stored files for owners that are being removed. */
export async function removeForOwners(ownerType: OwnerType, ownerIds: string[]): Promise<void> {
  if (ownerIds.length === 0) return;
  const rows = await prisma.attachment.findMany({ where: { ownerType, ownerId: { in: ownerIds } } });
  await prisma.attachment.deleteMany({ where: { ownerType, ownerId: { in: ownerIds } } });
  const storage = getStorage();
  await Promise.all(
    rows.filter((r) => r.kind === 'file' && r.storageKey).map((r) => storage.remove(r.storageKey as string)),
  );
}

async function assertOwnerExists(ownerType: OwnerType, ownerId: string): Promise<void> {
  const where = { where: { id: ownerId }, select: { id: true } };
  const found =
    ownerType === 'TASK'
      ? await prisma.task.findUnique(where)
      : ownerType === 'PERFORMANCE_TASK'
        ? await prisma.performanceTask.findUnique(where)
        : await prisma.reviewer.findUnique(where);
  if (!found) throw new HttpError(404, 'The item you are attaching to does not exist');
}

export async function addLink(input: {
  ownerType: OwnerType;
  ownerId: string;
  name: string;
  url: string;
}): Promise<PublicAttachment> {
  await assertOwnerExists(input.ownerType, input.ownerId);
  return prisma.attachment.create({ data: { ...input, kind: 'link' }, select: publicSelect });
}

export async function addFile(input: {
  ownerType: OwnerType;
  ownerId: string;
  name?: string | undefined;
  file: { originalname: string; buffer: Buffer };
}): Promise<PublicAttachment> {
  await assertOwnerExists(input.ownerType, input.ownerId);
  const originalName = fixFileName(input.file.originalname);
  const { extension, mimeType } = checkFile(originalName, input.file.buffer);
  const displayName = sanitizeText(input.name || originalName) || 'File';

  const stored = await getStorage().save({
    buffer: input.file.buffer,
    originalName,
    mimeType,
    extension,
  });
  try {
    return await prisma.attachment.create({
      data: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        kind: 'file',
        name: displayName,
        url: stored.url,
        mimeType,
        size: input.file.buffer.length,
        storageKey: stored.key,
      },
      select: publicSelect,
    });
  } catch (err) {
    await getStorage().remove(stored.key); // do not leave an orphan file if the database write fails
    throw err;
  }
}

export async function removeAttachment(id: string): Promise<void> {
  const row = await prisma.attachment.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, 'Attachment not found');
  await prisma.attachment.delete({ where: { id } });
  if (row.kind === 'file' && row.storageKey) await getStorage().remove(row.storageKey);
}
