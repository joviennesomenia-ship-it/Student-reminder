import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { toast } from '@/store/ui';
import type {
  Announcement,
  AttachmentOwner,
  EventItem,
  PerformanceTask,
  Reviewer,
  Subject,
  Task,
} from '@/types';

export const ENDPOINTS = {
  subject: { path: '/api/subjects', key: 'subjects' },
  task: { path: '/api/tasks', key: 'tasks' },
  performanceTask: { path: '/api/performance-tasks', key: 'performance-tasks' },
  reviewer: { path: '/api/reviewers', key: 'reviewers' },
  event: { path: '/api/events', key: 'events' },
  announcement: { path: '/api/announcements', key: 'announcements' },
} as const;

export type EntityKey = keyof typeof ENDPOINTS;

const useList = <T>(type: EntityKey) =>
  useQuery({ queryKey: [ENDPOINTS[type].key], queryFn: () => api<T[]>(ENDPOINTS[type].path) });

export const useSubjects = () => useList<Subject>('subject');
export const useTasks = () => useList<Task>('task');
export const usePerformanceTasks = () => useList<PerformanceTask>('performanceTask');
export const useReviewers = () => useList<Reviewer>('reviewer');
export const useEvents = () => useList<EventItem>('event');
export const useAnnouncements = () => useList<Announcement>('announcement');
/** Untyped list for the admin tables, which only need generic fields. */
export const useAnyList = (type: EntityKey) => useList<object>(type);

// ---- auth ----
export interface Me {
  admin: boolean;
  username?: string;
}

export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/api/auth/me'), staleTime: 5 * 60_000 });

export const useIsAdmin = (): boolean => useMe().data?.admin === true;

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username: string; password: string }) =>
      api<Me>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (me) => qc.setQueryData(['me'], me),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<undefined>('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.setQueryData(['me'], { admin: false });
      toast.info('Logged out');
    },
  });
}

// ---- admin writes ----
export function useSave(type: EntityKey) {
  const qc = useQueryClient();
  const { path, key } = ENDPOINTS[type];
  return useMutation({
    mutationFn: ({ id, data }: { id?: string | undefined; data: Record<string, unknown> }) =>
      api<{ id: string }>(id ? `${path}/${id}` : path, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [key] }),
  });
}

export function usePatch(type: EntityKey) {
  const qc = useQueryClient();
  const { path, key } = ENDPOINTS[type];
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api<unknown>(`${path}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [key] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemove(type: EntityKey) {
  const qc = useQueryClient();
  const { path, key } = ENDPOINTS[type];
  return useMutation({
    mutationFn: (id: string) => api<undefined>(`${path}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Deleting a subject also removes its items, so refresh everything.
      void qc.invalidateQueries({ queryKey: type === 'subject' ? [] : [key] });
      toast.success('Deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

const OWNER_KEY: Record<AttachmentOwner, string> = {
  TASK: 'tasks',
  PERFORMANCE_TASK: 'performance-tasks',
  REVIEWER: 'reviewers',
};

export function useAttachmentMutations(owner: AttachmentOwner) {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: [OWNER_KEY[owner]] });
  const onError = (e: Error) => toast.error(e.message);
  return {
    addLink: useMutation({
      mutationFn: (v: { ownerId: string; name: string; url: string }) =>
        api('/api/attachments/links', { method: 'POST', body: JSON.stringify({ ...v, ownerType: owner }) }),
      onSuccess: refresh,
      onError,
    }),
    upload: useMutation({
      mutationFn: (v: { ownerId: string; file: File }) => {
        const form = new FormData();
        form.append('ownerType', owner);
        form.append('ownerId', v.ownerId);
        form.append('file', v.file);
        return api('/api/upload', { method: 'POST', body: form });
      },
      onSuccess: refresh,
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<undefined>(`/api/attachments/${id}`, { method: 'DELETE' }),
      onSuccess: refresh,
      onError,
    }),
  };
}
