import {
  addDays,
  format,
  parseISO,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
} from 'date-fns';
import type {
  DayEntry,
  FoodGroup,
  MealEntry,
  SleepEntry,
  WaterEntry,
  WorkoutEntry,
} from '@/types';

export type Granularity = 'daily' | 'weekly' | 'monthly';

export function rangeForGranularity(g: Granularity): { from: string; to: string } {
  const today = new Date();
  if (g === 'daily') return { from: ymd(subDays(today, 29)), to: ymd(today) };
  if (g === 'weekly') return { from: ymd(subWeeks(today, 11)), to: ymd(today) };
  return { from: ymd(subMonths(today, 11)), to: ymd(today) };
}

export const ymd = (d: Date): string => format(d, 'yyyy-MM-dd');

function eachDay(from: string, to: string): string[] {
  const start = parseISO(from);
  const end = parseISO(to);
  const days: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(ymd(d));
  return days;
}

function bucketKey(date: string, g: Granularity): string {
  const d = parseISO(date);
  if (g === 'daily') return date;
  if (g === 'weekly') return ymd(startOfWeek(d, { weekStartsOn: 1 }));
  return ymd(startOfMonth(d));
}

function bucketDates(g: Granularity): string[] {
  const { from, to } = rangeForGranularity(g);
  if (g === 'daily') return eachDay(from, to);
  if (g === 'weekly') {
    const start = startOfWeek(parseISO(from), { weekStartsOn: 1 });
    const out: string[] = [];
    for (let d = start; d <= parseISO(to); d = addDays(d, 7)) out.push(ymd(d));
    return out;
  }
  // monthly
  const out: string[] = [];
  let cur = startOfMonth(parseISO(from));
  const end = parseISO(to);
  while (cur <= end) {
    out.push(ymd(cur));
    cur = startOfMonth(addDays(cur, 32));
  }
  return out;
}

/* ---------- Sleep ---------- */
export function aggregateSleep(
  rows: SleepEntry[],
  g: Granularity
): { date: string; hours: number | null; rolling: number | null }[] {
  const buckets = bucketDates(g);
  const map = new Map<string, number[]>();
  rows.forEach((r) => {
    const k = bucketKey(r.date, g);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r.hours);
  });
  const series = buckets.map((b) => {
    const xs = map.get(b);
    return {
      date: b,
      hours: xs ? round1(xs.reduce((a, x) => a + x, 0) / xs.length) : null,
    };
  });
  // 7-point rolling average (in whatever bucket units)
  return series.map((p, i, arr) => {
    const window = arr.slice(Math.max(0, i - 6), i + 1).filter((x) => x.hours != null);
    return {
      ...p,
      rolling:
        window.length >= 3
          ? round1(window.reduce((a, x) => a + (x.hours as number), 0) / window.length)
          : null,
    };
  });
}

/* ---------- Meals ---------- */
export function aggregateMeals(
  rows: MealEntry[],
  g: Granularity
): ({ date: string } & Partial<Record<FoodGroup, number>>)[] {
  const buckets = bucketDates(g);
  const map = new Map<string, Partial<Record<FoodGroup, number>>>();
  rows.forEach((r) => {
    const k = bucketKey(r.date, g);
    if (!map.has(k)) map.set(k, {});
    const slot = map.get(k)!;
    r.items.forEach((it) => {
      slot[it.group] = (slot[it.group] ?? 0) + (it.qty ?? 1);
    });
  });
  return buckets.map((b) => ({ date: b, ...(map.get(b) ?? {}) }));
}

/* ---------- Water ---------- */
export function aggregateWater(
  rows: WaterEntry[],
  g: Granularity
): { date: string; ml: number }[] {
  const buckets = bucketDates(g);
  const map = new Map<string, number>();
  const dailyTotals = new Map<string, number>();

  rows.forEach((r) => {
    dailyTotals.set(r.date, (dailyTotals.get(r.date) ?? 0) + r.ml);
  });

  if (g === 'daily') {
    return buckets.map((b) => ({ date: b, ml: dailyTotals.get(b) ?? 0 }));
  }

  // for weekly/monthly: average daily ml in that bucket so the y-axis stays comparable
  const counts = new Map<string, number>();
  for (const [d, ml] of dailyTotals.entries()) {
    const k = bucketKey(d, g);
    map.set(k, (map.get(k) ?? 0) + ml);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return buckets.map((b) => {
    const total = map.get(b) ?? 0;
    const days = counts.get(b) ?? 0;
    return { date: b, ml: days > 0 ? Math.round(total / days) : 0 };
  });
}

/* ---------- Sport ---------- */
export function aggregateSport(
  rows: WorkoutEntry[],
  g: Granularity
): { date: string; minutes: number; sessions: number }[] {
  const buckets = bucketDates(g);
  const map = new Map<string, { min: number; sess: number }>();
  rows.forEach((r) => {
    const k = bucketKey(r.date, g);
    const cur = map.get(k) ?? { min: 0, sess: 0 };
    cur.min += r.durationMin;
    cur.sess += 1;
    map.set(k, cur);
  });
  return buckets.map((b) => {
    const v = map.get(b);
    return { date: b, minutes: v?.min ?? 0, sessions: v?.sess ?? 0 };
  });
}

/* ---------- Mood vs Sleep ---------- */
export function aggregateMoodSleep(
  days: DayEntry[],
  sleeps: SleepEntry[],
  g: Granularity
): { date: string; mood: number | null; energy: number | null; sleepHours: number | null }[] {
  const buckets = bucketDates(g);
  const m = new Map<string, { mood: number[]; energy: number[]; sleep: number[] }>();
  const ensure = (k: string) => {
    if (!m.has(k)) m.set(k, { mood: [], energy: [], sleep: [] });
    return m.get(k)!;
  };
  days.forEach((d) => {
    const slot = ensure(bucketKey(d.date, g));
    if (d.mood != null) slot.mood.push(d.mood);
    if (d.energy != null) slot.energy.push(d.energy);
  });
  sleeps.forEach((s) => {
    ensure(bucketKey(s.date, g)).sleep.push(s.hours);
  });
  return buckets.map((b) => {
    const x = m.get(b);
    return {
      date: b,
      mood: x && x.mood.length ? round1(avg(x.mood)) : null,
      energy: x && x.energy.length ? round1(avg(x.energy)) : null,
      sleepHours: x && x.sleep.length ? round1(avg(x.sleep)) : null,
    };
  });
}

/* ---------- Stats ---------- */
export function pearson(xs: (number | null)[], ys: (number | null)[]): number | null {
  const pairs = xs
    .map((x, i) => [x, ys[i]] as [number | null, number | null])
    .filter(([x, y]) => x != null && y != null) as [number, number][];
  if (pairs.length < 4) return null;
  const meanX = avg(pairs.map((p) => p[0]));
  const meanY = avg(pairs.map((p) => p[1]));
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (const [x, y] of pairs) {
    const dx = x - meanX;
    const dy = y - meanY;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  if (den === 0) return null;
  return Math.round((num / den) * 100) / 100;
}

const avg = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;
const round1 = (n: number) => Math.round(n * 10) / 10;
