export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type AttachmentOwner = 'TASK' | 'PERFORMANCE_TASK' | 'REVIEWER';
export type AttachmentKind = 'file' | 'link';

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Attachment {
  id: string;
  ownerType: AttachmentOwner;
  ownerId: string;
  kind: AttachmentKind;
  name: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  dueAt: string;
  priority: Priority;
  pinned: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

export interface PerformanceTask {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  dueAt: string;
  rubricText: string | null;
  rubricUrl: string | null;
  pinned: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Reviewer {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  tag: string;
  pinned: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  pinned: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}
