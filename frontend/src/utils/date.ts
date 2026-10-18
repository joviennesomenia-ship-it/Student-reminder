import { siteConfig } from '@/config';

const tz = siteConfig.timezone;
const LOCALE = 'en-PH';

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE, { timeZone: tz, ...opts });

export const formatDate = (iso: string | Date): string =>
  fmt({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
export const formatShortDate = (iso: string | Date): string =>
  fmt({ month: 'short', day: 'numeric' }).format(new Date(iso));
export const formatTime = (iso: string | Date): string =>
  fmt({ hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
export const formatDateTime = (iso: string | Date): string => `${formatDate(iso)}, ${formatTime(iso)}`;
export const formatLongDate = (d: Date): string =>
  fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);
export const formatMonthYear = (year: number, month: number): string =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month, 1)),
  );

interface Parts {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
  minute: number;
}

export function zonedParts(date: Date): Parts {
  const get = (type: string, list: Intl.DateTimeFormatPart[]): number =>
    Number(list.find((p) => p.type === type)?.value ?? 0);
  const list = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(date);
  return {
    year: get('year', list),
    month: get('month', list) - 1,
    day: get('day', list),
    hour: get('hour', list),
    minute: get('minute', list),
  };
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** "2026-10-18" for the calendar day this instant falls on in the site's timezone. */
export function dayKey(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}`;
}

export const keyFromYMD = (y: number, m: number, d: number): string => {
  const u = new Date(Date.UTC(y, m, d));
  return `${u.getUTCFullYear()}-${pad(u.getUTCMonth() + 1)}-${pad(u.getUTCDate())}`;
};

/** Whole calendar days from a to b (b later => positive). */
export function dayDiff(aKey: string, bKey: string): number {
  const toUtc = (k: string): number => {
    const [y = 0, m = 1, d = 1] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(bKey) - toUtc(aKey)) / 86_400_000);
}

/** datetime-local value ("2026-10-20T08:00") -> UTC Date, reading the text in the site's timezone. */
export function zonedToUtc(local: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return new Date(NaN);
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(guess));
    const shown = Date.UTC(p.year, p.month, p.day, p.hour, p.minute);
    guess += asUtc - shown;
  }
  return new Date(guess);
}

/** ISO string -> datetime-local value in the site's timezone. */
export function toInputValue(iso: string): string {
  const p = zonedParts(new Date(iso));
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export type Tone = 'overdue' | 'urgent' | 'soon' | 'ok';

export interface Countdown {
  label: string;
  tone: Tone;
  days: number;
}

export function countdown(iso: string, now: Date): Countdown {
  const due = new Date(iso);
  const days = dayDiff(dayKey(now), dayKey(due));
  const ms = due.getTime() - now.getTime();
  if (ms < 0) {
    const ago = -days;
    return { label: ago <= 0 ? 'Overdue (today)' : `Overdue by ${ago} day${ago === 1 ? '' : 's'}`, tone: 'overdue', days };
  }
  if (days === 0) {
    const hours = Math.floor(ms / 3_600_000);
    return { label: hours < 1 ? 'Due within the hour' : `Due today (in ${hours}h)`, tone: 'urgent', days };
  }
  if (days === 1) return { label: 'Due tomorrow', tone: 'urgent', days };
  return { label: `Due in ${days} days`, tone: days <= 3 ? 'soon' : 'ok', days };
}

export type DueStatus = 'Upcoming' | 'Due Soon' | 'Overdue';

export function dueStatus(iso: string, now: Date): DueStatus {
  const c = countdown(iso, now);
  if (c.tone === 'overdue') return 'Overdue';
  return c.days <= 7 ? 'Due Soon' : 'Upcoming';
}

export const startOfWeekKey = (key: string): string => {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return keyFromYMD(y, m - 1, d - dow);
};
