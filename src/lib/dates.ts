import { format, parseISO, startOfWeek, addDays, differenceInCalendarDays } from 'date-fns';

export function todayKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

export function prettyLongDate(key: string): string {
  return format(parseISO(key), "EEEE',' d MMMM yyyy");
}

export function shortDate(key: string): string {
  return format(parseISO(key), 'dd MMM yyyy');
}

export function weekdayShort(key: string): string {
  return format(parseISO(key), 'EEE').toUpperCase();
}

// Mon-Sun week — keep consistent with sport weekly target
export function weekKeysFor(date: string): string[] {
  const d = parseISO(date);
  const start = startOfWeek(d, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

export function daysAgo(key: string): number {
  return differenceInCalendarDays(new Date(), parseISO(key));
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
