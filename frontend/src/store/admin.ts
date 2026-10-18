import { create } from 'zustand';

export type EntityType = 'subject' | 'task' | 'performanceTask' | 'reviewer' | 'event' | 'announcement';

interface AdminState {
  form: { type: EntityType; item: object | null } | null;
  open: (type: EntityType, item?: object | null) => void;
  close: () => void;
}

export const useAdminForm = create<AdminState>((set) => ({
  form: null,
  open: (type, item = null) => set({ form: { type, item } }),
  close: () => set({ form: null }),
}));

interface ConfirmState {
  pending: { title: string; body: string; confirmLabel: string; resolve: (ok: boolean) => void } | null;
  ask: (title: string, body: string, confirmLabel?: string) => Promise<boolean>;
  answer: (ok: boolean) => void;
}

export const useConfirm = create<ConfirmState>((set, get) => ({
  pending: null,
  ask: (title, body, confirmLabel = 'Delete') =>
    new Promise<boolean>((resolve) => set({ pending: { title, body, confirmLabel, resolve } })),
  answer: (ok) => {
    get().pending?.resolve(ok);
    set({ pending: null });
  },
}));
