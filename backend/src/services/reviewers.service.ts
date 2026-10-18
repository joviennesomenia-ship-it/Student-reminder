import type { Reviewer } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import type { ReviewerInput, SubjectQuery } from '../schemas.js';
import { removeForOwners, withAttachments, type WithAttachments } from './attachments.service.js';
import type { Resource } from './resource.js';

type Row = WithAttachments<Reviewer>;
const OWNER = 'REVIEWER' as const;

export const reviewersService: Resource<Row, ReviewerInput, SubjectQuery> = {
  async list(q) {
    const rows = await prisma.reviewer.findMany({
      where: q.subjectId ? { subjectId: q.subjectId } : {},
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
    return withAttachments(OWNER, rows);
  },
  async get(id) {
    const row = await prisma.reviewer.findUnique({ where: { id } });
    if (!row) throw notFound('Reviewer');
    return (await withAttachments(OWNER, [row]))[0] as Row;
  },
  async create(data) {
    const row = await prisma.reviewer.create({ data });
    return { ...row, attachments: [] };
  },
  async update(id, data) {
    const row = await prisma.reviewer.update({ where: { id }, data });
    return (await withAttachments(OWNER, [row]))[0] as Row;
  },
  async remove(id) {
    await removeForOwners(OWNER, [id]);
    await prisma.reviewer.delete({ where: { id } });
  },
};
