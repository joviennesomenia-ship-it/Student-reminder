import type { Task } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import type { SubjectQuery, TaskInput } from '../schemas.js';
import { removeForOwners, withAttachments, type WithAttachments } from './attachments.service.js';
import type { Resource } from './resource.js';

type Row = WithAttachments<Task>;
const OWNER = 'TASK' as const;

export const tasksService: Resource<Row, TaskInput, SubjectQuery> = {
  async list(q) {
    const rows = await prisma.task.findMany({
      where: q.subjectId ? { subjectId: q.subjectId } : {},
      orderBy: { dueAt: 'asc' },
    });
    return withAttachments(OWNER, rows);
  },
  async get(id) {
    const row = await prisma.task.findUnique({ where: { id } });
    if (!row) throw notFound('Task');
    return (await withAttachments(OWNER, [row]))[0] as Row;
  },
  async create(data) {
    const row = await prisma.task.create({ data });
    return { ...row, attachments: [] };
  },
  async update(id, data) {
    const row = await prisma.task.update({ where: { id }, data });
    return (await withAttachments(OWNER, [row]))[0] as Row;
  },
  async remove(id) {
    await removeForOwners(OWNER, [id]);
    await prisma.task.delete({ where: { id } });
  },
};
