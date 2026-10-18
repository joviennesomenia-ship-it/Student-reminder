import type { PerformanceTask } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import type { PerformanceTaskInput, SubjectQuery } from '../schemas.js';
import { removeForOwners, withAttachments, type WithAttachments } from './attachments.service.js';
import type { Resource } from './resource.js';

type Row = WithAttachments<PerformanceTask>;
const OWNER = 'PERFORMANCE_TASK' as const;

export const performanceTasksService: Resource<Row, PerformanceTaskInput, SubjectQuery> = {
  async list(q) {
    const rows = await prisma.performanceTask.findMany({
      where: q.subjectId ? { subjectId: q.subjectId } : {},
      orderBy: { dueAt: 'asc' },
    });
    return withAttachments(OWNER, rows);
  },
  async get(id) {
    const row = await prisma.performanceTask.findUnique({ where: { id } });
    if (!row) throw notFound('Performance task');
    return (await withAttachments(OWNER, [row]))[0] as Row;
  },
  async create(data) {
    const row = await prisma.performanceTask.create({ data });
    return { ...row, attachments: [] };
  },
  async update(id, data) {
    const row = await prisma.performanceTask.update({ where: { id }, data });
    return (await withAttachments(OWNER, [row]))[0] as Row;
  },
  async remove(id) {
    await removeForOwners(OWNER, [id]);
    await prisma.performanceTask.delete({ where: { id } });
  },
};
