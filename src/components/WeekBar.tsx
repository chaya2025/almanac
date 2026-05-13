import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

type Props = {
  weekKeys: string[];
  values: number[]; // minutes for each day
  target: number; // total minutes/week
  todayKey: string;
};

export default function WeekBar({ weekKeys, values, target, todayKey }: Props) {
  const max = Math.max(target / 7, ...values, 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-24">
        {weekKeys.map((k, i) => {
          const v = values[i] ?? 0;
          const h = (v / max) * 100;
          const isToday = k === todayKey;
          return (
            <div key={k} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full h-full flex items-end">
                <div
                  className={clsx(
                    'w-full transition-all duration-500',
                    v > 0 ? (isToday ? 'bg-clay' : 'hatch') : 'bg-rule/40',
                    isToday && 'ring-1 ring-ink'
                  )}
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`${v} min`}
                />
              </div>
              <span className={clsx('text-[10px] uppercase tracking-wider nums', isToday ? 'text-clay-deep' : 'text-ink-mute')}>
                {format(parseISO(k), 'EEEEE')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
