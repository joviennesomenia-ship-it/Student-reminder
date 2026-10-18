import { z } from 'zod';
import type { EntityKey } from '@/api/hooks';
import type { AttachmentOwner } from '@/types';
import { toInputValue, zonedToUtc } from '@/utils/date';

export type Values = Record<string, string | boolean>;
export type FieldKind = 'text' | 'textarea' | 'select' | 'datetime' | 'checkbox' | 'color' | 'url';

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  options?: 'subjects' | 'priority';
  hint?: string;
}

export interface EntityConfig {
  title: string;
  fields: FieldDef[];
  schema: z.ZodType<Values>;
  defaults: Values;
  fromItem: (item: object) => Values;
  toPayload: (v: Values) => Record<string, unknown>;
  attachmentOwner?: AttachmentOwner;
}

const get = (o: object, k: string): unknown => (o as Record<string, unknown>)[k];
const str = (o: object, k: string): string => {
  const v = get(o, k);
  return typeof v === 'string' ? v : '';
};
const bool = (o: object, k: string): boolean => get(o, k) === true;

const required = (label: string) => z.string().trim().min(1, `${label} is required`);
const dateField = (label: string) =>
  z.string().min(1, `${label} is required`).refine((v) => !Number.isNaN(zonedToUtc(v).getTime()), 'Pick a valid date and time');
const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Use a link that starts with http:// or https://');

const iso = (v: string | boolean): string => zonedToUtc(String(v)).toISOString();
const defaultDue = (): string => {
  const d = new Date(Date.now() + 86_400_000);
  return `${toInputValue(d.toISOString()).slice(0, 10)}T08:00`;
};

const description: FieldDef = { name: 'description', label: 'Description', kind: 'textarea' };
const pinned: FieldDef = { name: 'pinned', label: '📌 Pin this item (shows first)', kind: 'checkbox' };

export const ENTITY_CONFIG: Record<EntityKey, EntityConfig> = {
  subject: {
    title: 'subject',
    fields: [
      { name: 'name', label: 'Subject name', kind: 'text' },
      { name: 'emoji', label: 'Emoji', kind: 'text', hint: 'One emoji, for example 🧮' },
      { name: 'color', label: 'Color', kind: 'color' },
    ],
    schema: z.object({
      name: required('Name').max(60),
      emoji: required('Emoji').max(16),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color'),
    }),
    defaults: { name: '', emoji: '📘', color: '#1d4ed8' },
    fromItem: (i) => ({ name: str(i, 'name'), emoji: str(i, 'emoji'), color: str(i, 'color') }),
    toPayload: (v) => ({ name: v['name'], emoji: v['emoji'], color: v['color'] }),
  },
  task: {
    title: 'task',
    attachmentOwner: 'TASK',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'subjectId', label: 'Subject', kind: 'select', options: 'subjects' },
      { name: 'dueAt', label: 'Due date and time', kind: 'datetime' },
      { name: 'priority', label: 'Priority', kind: 'select', options: 'priority' },
      description,
      pinned,
    ],
    schema: z.object({
      title: required('Title').max(200),
      subjectId: required('Subject'),
      dueAt: dateField('Due date'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      description: z.string().max(5000),
      pinned: z.boolean(),
    }),
    defaults: { title: '', subjectId: '', dueAt: defaultDue(), priority: 'MEDIUM', description: '', pinned: false },
    fromItem: (i) => ({
      title: str(i, 'title'),
      subjectId: str(i, 'subjectId'),
      dueAt: toInputValue(str(i, 'dueAt')),
      priority: str(i, 'priority') || 'MEDIUM',
      description: str(i, 'description'),
      pinned: bool(i, 'pinned'),
    }),
    toPayload: (v) => ({ ...v, dueAt: iso(v['dueAt'] ?? '') }),
  },
  performanceTask: {
    title: 'performance task',
    attachmentOwner: 'PERFORMANCE_TASK',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'subjectId', label: 'Subject', kind: 'select', options: 'subjects' },
      { name: 'dueAt', label: 'Due date and time', kind: 'datetime' },
      { ...description, label: 'Instructions' },
      { name: 'rubricText', label: 'Rubric (text)', kind: 'textarea', hint: 'Or attach the rubric as a file below after saving.' },
      { name: 'rubricUrl', label: 'Rubric link', kind: 'url', placeholder: 'https://' },
      pinned,
    ],
    schema: z.object({
      title: required('Title').max(200),
      subjectId: required('Subject'),
      dueAt: dateField('Due date'),
      description: z.string().max(5000),
      rubricText: z.string().max(5000),
      rubricUrl: optionalUrl,
      pinned: z.boolean(),
    }),
    defaults: { title: '', subjectId: '', dueAt: defaultDue(), description: '', rubricText: '', rubricUrl: '', pinned: false },
    fromItem: (i) => ({
      title: str(i, 'title'),
      subjectId: str(i, 'subjectId'),
      dueAt: toInputValue(str(i, 'dueAt')),
      description: str(i, 'description'),
      rubricText: str(i, 'rubricText'),
      rubricUrl: str(i, 'rubricUrl'),
      pinned: bool(i, 'pinned'),
    }),
    toPayload: (v) => ({
      ...v,
      dueAt: iso(v['dueAt'] ?? ''),
      rubricText: v['rubricText'] === '' ? null : v['rubricText'],
      rubricUrl: v['rubricUrl'] === '' ? null : v['rubricUrl'],
    }),
  },
  reviewer: {
    title: 'reviewer',
    attachmentOwner: 'REVIEWER',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'subjectId', label: 'Subject', kind: 'select', options: 'subjects' },
      { name: 'tag', label: 'Topic or quarter', kind: 'text', placeholder: 'Q2, Photosynthesis...' },
      description,
      pinned,
    ],
    schema: z.object({
      title: required('Title').max(200),
      subjectId: required('Subject'),
      tag: z.string().max(40),
      description: z.string().max(5000),
      pinned: z.boolean(),
    }),
    defaults: { title: '', subjectId: '', tag: '', description: '', pinned: false },
    fromItem: (i) => ({
      title: str(i, 'title'),
      subjectId: str(i, 'subjectId'),
      tag: str(i, 'tag'),
      description: str(i, 'description'),
      pinned: bool(i, 'pinned'),
    }),
    toPayload: (v) => ({ ...v }),
  },
  event: {
    title: 'event',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'startsAt', label: 'Starts', kind: 'datetime' },
      { name: 'endsAt', label: 'Ends', kind: 'datetime' },
      { name: 'location', label: 'Location', kind: 'text' },
      description,
      pinned,
    ],
    schema: z
      .object({
        title: required('Title').max(200),
        startsAt: dateField('Start'),
        endsAt: dateField('End'),
        location: z.string().max(200),
        description: z.string().max(5000),
        pinned: z.boolean(),
      })
      .refine((v) => zonedToUtc(v.endsAt) >= zonedToUtc(v.startsAt), { message: 'The event cannot end before it starts', path: ['endsAt'] }),
    defaults: { title: '', startsAt: defaultDue(), endsAt: defaultDue().replace('T08:00', 'T09:00'), location: '', description: '', pinned: false },
    fromItem: (i) => ({
      title: str(i, 'title'),
      startsAt: toInputValue(str(i, 'startsAt')),
      endsAt: toInputValue(str(i, 'endsAt')),
      location: str(i, 'location'),
      description: str(i, 'description'),
      pinned: bool(i, 'pinned'),
    }),
    toPayload: (v) => ({ ...v, startsAt: iso(v['startsAt'] ?? ''), endsAt: iso(v['endsAt'] ?? '') }),
  },
  announcement: {
    title: 'announcement',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'body', label: 'Message', kind: 'textarea' },
      pinned,
    ],
    schema: z.object({ title: required('Title').max(200), body: required('Message').max(5000), pinned: z.boolean() }),
    defaults: { title: '', body: '', pinned: false },
    fromItem: (i) => ({ title: str(i, 'title'), body: str(i, 'body'), pinned: bool(i, 'pinned') }),
    toPayload: (v) => ({ ...v }),
  },
};
