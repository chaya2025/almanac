import { format, parseISO, subDays } from 'date-fns';

/**
 * Given a set of dates (YYYY-MM-DD strings, can include duplicates) and "today",
 * return the count of consecutive days ending at today (inclusive) on which at
 * least one date is present.
 */
export function currentStreak(dates: Iterable<string>, todayKey: string): number {
  const set = new Set(dates);
  if (!set.has(todayKey)) return 0;
  let count = 0;
  let cur = parseISO(todayKey);
  while (set.has(format(cur, 'yyyy-MM-dd'))) {
    count++;
    cur = subDays(cur, 1);
  }
  return count;
}
