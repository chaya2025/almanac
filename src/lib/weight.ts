import { format, parseISO, differenceInCalendarDays, getDay } from 'date-fns';
import type { WeightEntry } from '@/types';

export const isSunday = (d: Date | string = new Date()): boolean => {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return getDay(date) === 0;
};

export function bmi(kg?: number, heightCm?: number): number | null {
  if (!kg || !heightCm) return null;
  const m = heightCm / 100;
  return Math.round((kg / (m * m)) * 10) / 10;
}

export function bmiBand(b: number | null): { label: string; tone: 'good' | 'warn' | 'bad' } | null {
  if (b == null) return null;
  if (b < 18.5) return { label: 'underweight', tone: 'warn' };
  if (b < 25) return { label: 'healthy range', tone: 'good' };
  if (b < 30) return { label: 'above range', tone: 'warn' };
  return { label: 'high range', tone: 'bad' };
}

export function latest(weights: WeightEntry[]): WeightEntry | undefined {
  if (!weights.length) return undefined;
  return [...weights].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export function previous(weights: WeightEntry[]): WeightEntry | undefined {
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted[1];
}

export function delta(weights: WeightEntry[]): number | null {
  const a = latest(weights);
  const b = previous(weights);
  if (!a || !b) return null;
  return Math.round((a.kg - b.kg) * 10) / 10;
}

export function daysSinceLast(weights: WeightEntry[]): number | null {
  const a = latest(weights);
  if (!a) return null;
  return differenceInCalendarDays(new Date(), parseISO(a.date));
}

// 4-point trailing moving average for trend smoothing
export function trendSeries(weights: WeightEntry[]): { date: string; kg: number; trend: number | null }[] {
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  return sorted.map((w, i, arr) => {
    const window = arr.slice(Math.max(0, i - 3), i + 1);
    const trend = window.length >= 2
      ? Math.round((window.reduce((s, x) => s + x.kg, 0) / window.length) * 10) / 10
      : null;
    return { date: w.date, kg: w.kg, trend };
  });
}

export function fmtKg(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

export function fmtDate(date: string): string {
  return format(parseISO(date), 'd MMM');
}
