import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays, parseISO } from 'date-fns';
import clsx from 'clsx';
import { db } from '@/db/schema';
import { todayKey } from '@/lib/dates';
import { currentStreak } from '@/lib/streaks';

const RANGE_DAYS = 60;

export default function StreakStrip() {
  const today = todayKey();
  const from = format(subDays(parseISO(today), RANGE_DAYS), 'yyyy-MM-dd');

  const sleep = useLiveQuery(
    () => db.sleep.where('date').between(from, today, true, true).toArray(),
    [from, today]
  );
  const meals = useLiveQuery(
    () => db.meals.where('date').between(from, today, true, true).toArray(),
    [from, today]
  );
  const water = useLiveQuery(
    () => db.water.where('date').between(from, today, true, true).toArray(),
    [from, today]
  );
  const workouts = useLiveQuery(
    () => db.workouts.where('date').between(from, today, true, true).toArray(),
    [from, today]
  );
  const days = useLiveQuery(
    () => db.days.where('date').between(from, today, true, true).toArray(),
    [from, today]
  );

  const items = [
    { label: 'sleep', count: currentStreak(sleep?.map((s) => s.date) ?? [], today) },
    {
      label: 'meals',
      count: currentStreak(
        (meals ?? []).filter((m) => m.items.length > 0).map((m) => m.date),
        today
      ),
    },
    { label: 'water', count: currentStreak(water?.map((w) => w.date) ?? [], today) },
    { label: 'sport', count: currentStreak(workouts?.map((w) => w.date) ?? [], today) },
    {
      label: 'journal',
      count: currentStreak(
        (days ?? []).filter((d) => d.journal && d.journal.trim().length > 0).map((d) => d.date),
        today
      ),
    },
  ];

  const anyActive = items.some((i) => i.count > 0);
  if (!anyActive) return null;

  return (
    <div className="reveal flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-4 mb-6 text-sm">
      <span className="label">streaks ·</span>
      {items.map((it) => (
        <span key={it.label} className="flex items-baseline gap-1.5">
          <span className="label">{it.label}</span>
          <span
            className={clsx(
              'font-display nums',
              it.count === 0
                ? 'text-ink-mute'
                : it.count >= 7
                ? 'text-clay-deep'
                : 'text-ink'
            )}
          >
            {it.count}
          </span>
        </span>
      ))}
    </div>
  );
}
