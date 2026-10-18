import { create } from 'zustand';

const KEY = 'sr-notify';

interface RemindersState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  bannerDismissed: boolean;
  dismissBanner: () => void;
}

export const useReminders = create<RemindersState>((set) => ({
  enabled: (() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  })(),
  setEnabled: (enabled) => {
    set({ enabled });
    try {
      localStorage.setItem(KEY, enabled ? '1' : '0');
    } catch {
      /* ignore */
    }
  },
  bannerDismissed: false,
  dismissBanner: () => set({ bannerDismissed: true }),
}));
