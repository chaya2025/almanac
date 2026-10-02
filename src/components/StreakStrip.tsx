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
    { label: 'sleep', tone: 'tone-night', count: currentStreak(sleep?.map((s) => s.date) ?? [], today) },
    {
      label: 'meals',
      tone: 'tone-tang',
      count: currentStreak(
        (meals ?? []).filter((m) => m.items.length > 0).map((m) => m.date),
        today
      ),
    },
    { label: 'water', tone: 'tone-aqua', count: currentStreak(water?.map((w) => w.date) ?? [], today) },
    { label: 'sport', tone: 'tone-leaf', count: currentStreak(workouts?.map((w) => w.date) ?? [], today) },
    {
      label: 'journal',
      tone: 'tone-coral',
      count: currentStreak(
        (days ?? []).filter((d) => d.journal && d.journal.trim().length > 0).map((d) => d.date),
        today
      ),
    },
  ];

  const anyActive = items.some((i) => i.count > 0);
  if (!anyActive) return null;

  return (
    <div className="reveal flex flex-wrap items-center gap-2 mt-5 mb-6">
      <span className="label mr-1">streaks</span>
      {items.map((it) => (
        <span
          key={it.label}
          className={clsx(
            it.tone,
            'inline-flex items-center gap-1.5 rounded-full border-2 pl-1 pr-3 py-0.5 text-sm transition-transform hover:-rotate-2',
            it.count === 0 ? 'border-ink/20 bg-white/50 text-ink-mute' : 'border-ink bg-tone-soft shadow-pop-sm'
          )}
        >
          <span
            className={clsx(
              'h-7 min-w-7 px-1 rounded-full grid place-items-center font-display font-black nums text-base leading-none',
              it.count === 0 ? 'bg-ink/5' : 'bg-tone border-2 border-ink'
            )}
          >
            {it.count}
          </span>
          <span className="text-[11px] uppercase tracking-[0.14em] font-bold">{it.label}</span>
          {it.count >= 7 && <span aria-label="on fire">🔥</span>}
        </span>
      ))}
    </div>
  );
}
