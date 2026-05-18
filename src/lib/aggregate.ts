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
import { db } from '@/db/schema';
import type {
  DayEntry,
  FoodGroup,
  MealEntry,
  MealSlot,
  Profile,
  SleepEntry,
  WaterEntry,
  WeekSummary,
  WorkoutEntry,
} from '@/types';
import { MEAL_SLOTS } from '@/types';
import { scoreMealsForDay, scoreSleep, scoreWater } from '@/lib/scoring';

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
): { date: string; hours: number | null; rolling: number | null; bedtimeH: number | null }[] {
  const buckets = bucketDates(g);
  const hoursMap = new Map<string, number[]>();
  const bedtimeMap = new Map<string, number[]>();
  rows.forEach((r) => {
    const k = bucketKey(r.date, g);
    if (!hoursMap.has(k)) hoursMap.set(k, []);
    hoursMap.get(k)!.push(r.hours);
    const bt = parseTimeToMinutes(r.bedtime);
    if (bt != null) {
      // shift early-AM bedtimes (< 6am) forward by 24h so 01:00 averages near midnight not noon
      const adjusted = bt < 6 * 60 ? bt + 24 * 60 : bt;
      if (!bedtimeMap.has(k)) bedtimeMap.set(k, []);
      bedtimeMap.get(k)!.push(adjusted);
    }
  });
  const series = buckets.map((b) => {
    const xs = hoursMap.get(b);
    const bts = bedtimeMap.get(b);
    const avgBt = bts && bts.length ? bts.reduce((a, x) => a + x, 0) / bts.length : null;
    // expose bedtime in hours-past-18:00 for chart plotting (18:00 = 0, midnight = 6, 02:00 = 8)
    const bedtimeH = avgBt == null ? null : round1((avgBt - 18 * 60) / 60);
    return {
      date: b,
      hours: xs ? round1(xs.reduce((a, x) => a + x, 0) / xs.length) : null,
      bedtimeH,
    };
  });
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

function parseTimeToMinutes(t: string | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
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

/* ---------- Weekly digest ---------- */

/** weekKey = Monday of the week to summarize (yyyy-MM-dd). */
export async function summarizeWeek(weekKey: string, profile: Profile): Promise<WeekSummary> {
  const monday = parseISO(weekKey);
  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'));
  const from = dates[0];
  const to = dates[6];

  const [sleeps, meals, waters, workouts, weights, days] = await Promise.all([
    db.sleep.where('date').between(from, to, true, true).toArray(),
    db.meals.where('date').between(from, to, true, true).toArray(),
    db.water.where('date').between(from, to, true, true).toArray(),
    db.workouts.where('date').between(from, to, true, true).toArray(),
    db.weights.where('date').between(from, to, true, true).toArray(),
    db.days.where('date').between(from, to, true, true).toArray(),
  ]);

  // sleep
  const sleepNights = sleeps.length;
  const sleepAvg = sleepNights ? round1(avg(sleeps.map((s) => s.hours))) : null;

  // water
  const waterByDay = new Map<string, number>();
  waters.forEach((w) => waterByDay.set(w.date, (waterByDay.get(w.date) ?? 0) + w.ml));
  const waterTotal = Array.from(waterByDay.values()).reduce((a, x) => a + x, 0);
  const waterTarget = profile.waterTargetMl;
  const waterDaysOnTarget = Array.from(waterByDay.values()).filter((ml) => ml >= waterTarget).length;

  // sport
  const sportSessions = workouts.length;
  const sportMinutes = workouts.reduce((s, w) => s + w.durationMin, 0);
  const sportTargetMinutes = profile.sportSessionsPerWeek * profile.sportMinutesPerSession;

  // weight delta: latest in window minus prior weigh-in (whenever it was)
  let weightDelta: number | null = null;
  const lastInWindow = [...weights].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (lastInWindow) {
    const prior = await db.weights
      .where('date')
      .below(lastInWindow.date)
      .reverse()
      .first();
    if (prior) weightDelta = round1(lastInWindow.kg - prior.kg);
  }

  // most-missed meal slot (slot most often empty across these 7 days)
  const filledCount: Record<MealSlot, number> = {
    breakfast: 0, lunch: 0, dinner: 0, snack1: 0, snack2: 0,
  };
  for (const slot of MEAL_SLOTS) {
    for (const date of dates) {
      const m = meals.find((x) => x.date === date && x.slot === slot);
      if (m && m.items.length > 0) filledCount[slot]++;
    }
  }
  let mostMissedSlot: MealSlot | null = null;
  let worst = 8;
  for (const slot of MEAL_SLOTS) {
    if (filledCount[slot] < worst) {
      worst = filledCount[slot];
      mostMissedSlot = slot;
    }
  }

  // best day: highest combined sleep+meals+water score
  let bestDayKey: string | null = null;
  let bestDayScore: number | null = null;
  for (const date of dates) {
    const s = sleeps.find((x) => x.date === date);
    const mealsOnDay = meals.filter((x) => x.date === date);
    const waterOnDay = waterByDay.get(date) ?? 0;
    const score =
      scoreSleep(s?.hours, profile.sleepTargetHours) * 0.4 +
      scoreMealsForDay(mealsOnDay, profile.dietStyle) * 0.4 +
      scoreWater(waterOnDay, profile.waterTargetMl) * 0.2;
    if (bestDayScore == null || score > bestDayScore) {
      bestDayScore = Math.round(score);
      bestDayKey = date;
    }
  }

  const journalEntries = days.filter((d) => d.journal && d.journal.trim().length > 0).length;

  return {
    weekKey,
    sleepAvgHours: sleepAvg,
    sleepNightsLogged: sleepNights,
    waterTotalMl: waterTotal,
    waterDaysOnTarget,
    sportSessions,
    sportMinutes,
    sportTargetMinutes,
    weightDeltaKg: weightDelta,
    mostMissedSlot,
    bestDayKey,
    bestDayScore,
    journalEntries,
  };
}
