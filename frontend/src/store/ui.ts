import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

interface UiState {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toasts: Toast[];
  toast: (kind: ToastKind, text: string) => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useUi = create<UiState>((set, get) => ({
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  toasts: [],
  toast: (kind, text) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, kind, text }] }));
    window.setTimeout(() => get().dismissToast(id), kind === 'error' ? 9000 : 4500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (t: string) => useUi.getState().toast('success', t),
  error: (t: string) => useUi.getState().toast('error', t),
  info: (t: string) => useUi.getState().toast('info', t),
};
