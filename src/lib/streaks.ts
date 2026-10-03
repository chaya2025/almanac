import { format, parseISO, subDays } from 'date-fns';

/**
 * Given a set of dates (YYYY-MM-DD strings, can include duplicates) and "today",
 * return the count of consecutive logged days ending today. If today isn't logged
 * yet the streak still stands, counted back from yesterday, until the day is over.
 */
export function currentStreak(dates: Iterable<string>, todayKey: string): number {
  const set = new Set(dates);
  let cur = parseISO(todayKey);
  if (!set.has(todayKey)) cur = subDays(cur, 1);
  let count = 0;
  while (set.has(format(cur, 'yyyy-MM-dd'))) {
    count++;
    cur = subDays(cur, 1);
  }
  return count;
}
