import type { Subject } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import type { EmptyQuery, SubjectInput } from '../schemas.js';
import { removeForOwners } from './attachments.service.js';
import type { Resource } from './resource.js';

export const subjectsService: Resource<Subject, SubjectInput, EmptyQuery> = {
  list: () => prisma.subject.findMany({ orderBy: { name: 'asc' } }),
  async get(id) {
    const row = await prisma.subject.findUnique({ where: { id } });
    if (!row) throw notFound('Subject');
    return row;
  },
  create: (data) => prisma.subject.create({ data }),
  update: (id, data) => prisma.subject.update({ where: { id }, data }),
  async remove(id) {
    // Deleting a subject cascades to its items in the database; clean up their attachments first.
    const where = { where: { subjectId: id }, select: { id: true } };
    const [tasks, perfTasks, reviewers] = await Promise.all([
      prisma.task.findMany(where),
      prisma.performanceTask.findMany(where),
      prisma.reviewer.findMany(where),
    ]);
    await removeForOwners('TASK', tasks.map((t) => t.id));
    await removeForOwners('PERFORMANCE_TASK', perfTasks.map((t) => t.id));
    await removeForOwners('REVIEWER', reviewers.map((t) => t.id));
    await prisma.subject.delete({ where: { id } });
  },
};
