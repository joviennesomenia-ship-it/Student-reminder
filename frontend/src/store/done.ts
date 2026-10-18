import { create } from 'zustand';

// Each student's "done" ticks live only in their own browser (never sent to the server).
const KEY = 'sr-done';

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

interface DoneState {
  done: string[];
  isDone: (id: string) => boolean;
  toggle: (id: string) => void;
}

export const useDone = create<DoneState>((set, get) => ({
  done: load(),
  isDone: (id) => get().done.includes(id),
  toggle: (id) => {
    const done = get().done.includes(id) ? get().done.filter((d) => d !== id) : [...get().done, id];
    set({ done });
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {
      /* storage unavailable: tick still works for this visit */
    }
  },
}));
