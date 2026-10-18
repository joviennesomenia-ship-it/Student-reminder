import type { Announcement } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import type { AnnouncementInput, EmptyQuery } from '../schemas.js';
import type { Resource } from './resource.js';

export const announcementsService: Resource<Announcement, AnnouncementInput, EmptyQuery> = {
  list: () => prisma.announcement.findMany({ orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] }),
  async get(id) {
    const row = await prisma.announcement.findUnique({ where: { id } });
    if (!row) throw notFound('Announcement');
    return row;
  },
  create: (data) => prisma.announcement.create({ data }),
  update: (id, data) => prisma.announcement.update({ where: { id }, data }),
  async remove(id) {
    await prisma.announcement.delete({ where: { id } });
  },
};
