export interface IcsItem {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

const stamp = (d: Date): string => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function buildIcs(items: IcsItem[]): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Class Reminders//EN', 'CALSCALE:GREGORIAN'];
  for (const it of items) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${it.uid}@class-reminders`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(it.start)}`,
      `DTEND:${stamp(it.end)}`,
      `SUMMARY:${esc(it.title)}`,
    );
    if (it.description) lines.push(`DESCRIPTION:${esc(it.description)}`);
    if (it.location) lines.push(`LOCATION:${esc(it.location)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(items: IcsItem[], filename: string): void {
  const blob = new Blob([buildIcs(items)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
