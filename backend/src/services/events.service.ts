import type { Event } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError, notFound } from '../lib/errors.js';
import type { EventInput, EventQuery } from '../schemas.js';
import type { Resource } from './resource.js';

const assertOrder = (startsAt: Date, endsAt: Date): void => {
  if (endsAt < startsAt) throw new HttpError(400, 'An event cannot end before it starts');
};

export const eventsService: Resource<Event, EventInput, EventQuery> = {
  list(q) {
    const now = new Date();
    const where =
      q.scope === 'upcoming' ? { endsAt: { gte: now } } : q.scope === 'past' ? { endsAt: { lt: now } } : {};
    return prisma.event.findMany({ where, orderBy: { startsAt: q.scope === 'past' ? 'desc' : 'asc' } });
  },
  async get(id) {
    const row = await prisma.event.findUnique({ where: { id } });
    if (!row) throw notFound('Event');
    return row;
  },
  create(data) {
    assertOrder(data.startsAt, data.endsAt);
    return prisma.event.create({ data });
  },
  async update(id, data) {
    const current = await prisma.event.findUnique({ where: { id } });
    if (!current) throw notFound('Event');
    assertOrder(data.startsAt ?? current.startsAt, data.endsAt ?? current.endsAt);
    return prisma.event.update({ where: { id }, data });
  },
  async remove(id) {
    await prisma.event.delete({ where: { id } });
  },
};
