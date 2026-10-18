import { z } from 'zod';

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'URL must start with http:// or https://');

// Forms send "" for empty optional URLs; store that as null.
const optionalUrl = z.preprocess((v) => (v === '' ? null : v), httpUrl.nullable().optional());
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a color like #1d4ed8');
const text = (max: number) => z.string().trim().max(max);

export const subjectSchema = z.object({
  name: z.string().trim().min(1).max(60),
  emoji: z.string().trim().min(1).max(16).default('📘'),
  color: hexColor.default('#1d4ed8'),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: text(5000).default(''),
  subjectId: z.string().min(1),
  dueAt: z.coerce.date(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  pinned: z.boolean().default(false),
});

export const performanceTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: text(5000).default(''),
  subjectId: z.string().min(1),
  dueAt: z.coerce.date(),
  rubricText: text(5000).nullable().optional(),
  rubricUrl: optionalUrl,
  pinned: z.boolean().default(false),
});

export const reviewerSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: text(5000).default(''),
  subjectId: z.string().min(1),
  tag: text(40).default(''),
  pinned: z.boolean().default(false),
});

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: text(5000).default(''),
  location: text(200).default(''),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  pinned: z.boolean().default(false),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  pinned: z.boolean().default(false),
});

export const ownerTypeSchema = z.enum(['TASK', 'PERFORMANCE_TASK', 'REVIEWER']);

export const linkSchema = z.object({
  ownerType: ownerTypeSchema,
  ownerId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  url: httpUrl,
});

export const uploadFieldsSchema = z.object({
  ownerType: ownerTypeSchema,
  ownerId: z.string().min(1),
  name: z.string().trim().max(200).optional(),
});

export const emptyQuery = z.object({});
export const subjectQuery = z.object({ subjectId: z.string().min(1).optional() });
export const eventQuery = z.object({ scope: z.enum(['upcoming', 'past']).optional() });

export type SubjectInput = z.infer<typeof subjectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type PerformanceTaskInput = z.infer<typeof performanceTaskSchema>;
export type ReviewerInput = z.infer<typeof reviewerSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type OwnerType = z.infer<typeof ownerTypeSchema>;
export type SubjectQuery = z.infer<typeof subjectQuery>;
export type EventQuery = z.infer<typeof eventQuery>;
export type EmptyQuery = z.infer<typeof emptyQuery>;
