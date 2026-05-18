import { format, parseISO, startOfWeek, addDays, differenceInCalendarDays } from 'date-fns';
import type { TimeFormat } from '@/types';

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

/* ---------- Time-of-day helpers (HH:mm 24h strings) ---------- */

export function timeToMinutes(t: string | undefined | null): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

export function hoursBetween(bedtime: string | undefined, wakeTime: string | undefined): number | null {
  const b = timeToMinutes(bedtime);
  const w = timeToMinutes(wakeTime);
  if (b == null || w == null) return null;
  let diff = w - b;
  if (diff <= 0) diff += 24 * 60; // wrap over midnight
  return Math.round((diff / 60) * 10) / 10;
}

export function isWrapMidnight(bedtime?: string, wakeTime?: string): boolean {
  const b = timeToMinutes(bedtime);
  const w = timeToMinutes(wakeTime);
  if (b == null || w == null) return false;
  return b >= w;
}

export function formatTime(t: string | undefined | null, fmt: TimeFormat = '24h'): string {
  const mins = timeToMinutes(t);
  if (mins == null) return '—';
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const mm = String(m).padStart(2, '0');
  if (fmt === '24h') return `${String(h24).padStart(2, '0')}:${mm}`;
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${period}`;
}
