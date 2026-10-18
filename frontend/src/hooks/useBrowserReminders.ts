import { useEffect } from 'react';
import { useReminders } from '@/store/reminders';
import type { DueItem } from './useDueItems';
import { dayDiff, dayKey } from '@/utils/date';

const LAST = 'sr-notified-day';

/** Opt-in browser notification, at most once per day, for items due today or tomorrow. */
export function useBrowserReminders(due: DueItem[], now: Date): void {
  const enabled = useReminders((s) => s.enabled);
  useEffect(() => {
    if (!enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const today = dayKey(now);
    const soon = due.filter((d) => dayDiff(today, dayKey(new Date(d.dueAt))) <= 1);
    if (soon.length === 0) return;
    try {
      if (localStorage.getItem(LAST) === today) return;
      localStorage.setItem(LAST, today);
    } catch {
      /* storage blocked: may notify again on reload, acceptable */
    }
    new Notification('⏰ Class reminders', {
      body: soon.length === 1 ? `${soon[0]?.title} is due soon.` : `${soon.length} items are due today or tomorrow.`,
    });
  }, [enabled, due, now]);
}
