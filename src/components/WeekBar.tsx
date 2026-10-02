import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

type Props = {
  weekKeys: string[];
  values: number[]; // minutes for each day
  target: number; // total minutes/week
  todayKey: string;
};

export default function WeekBar({ weekKeys, values, target, todayKey }: Props) {
  const daily = target / 7;
  const max = Math.max(daily * 1.4, ...values, 1);
  const goalPct = (daily / max) * 100;
  return (
    <div>
      <div className="relative flex items-end gap-2 h-24">
        {/* daily goal line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-ink/20 pointer-events-none"
          style={{ bottom: `${goalPct}%` }}
        />
        {weekKeys.map((k, i) => {
          const v = values[i] ?? 0;
          const h = v > 0 ? Math.max(6, (v / max) * 100) : 3;
          return (
            <div key={k} className="relative flex-1 h-full flex items-end">
              <div
                className={clsx(
                  'w-full rounded-[5px] transition-all duration-700 ease-out',
                  v > 0 ? (v >= daily ? 'bg-tone' : 'bg-tone/45') : 'bg-paper-3'
                )}
                style={{ height: `${h}%`, transitionDelay: `${i * 40}ms` }}
                title={`${v} min`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {weekKeys.map((k) => (
          <span
            key={k}
            className={clsx(
              'flex-1 text-center text-[10px] uppercase tracking-wider nums',
              k === todayKey ? 'text-ink font-semibold' : 'text-ink-mute'
            )}
          >
            {format(parseISO(k), 'EEEEE')}
          </span>
        ))}
      </div>
    </div>
  );
}
