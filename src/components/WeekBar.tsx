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
      <div className="relative flex items-end gap-1.5 h-24">
        {/* daily goal line */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-ink/25 pointer-events-none"
          style={{ bottom: `${goalPct}%` }}
        />
        {weekKeys.map((k, i) => {
          const v = values[i] ?? 0;
          const h = v > 0 ? Math.max(10, (v / max) * 100) : 8;
          const hit = v > 0 && v >= daily;
          return (
            <div key={k} className="relative flex-1 h-full flex items-end">
              <div
                className={clsx(
                  'w-full rounded-t-[10px] rounded-b-[4px] transition-all duration-700 ease-out',
                  v > 0 ? 'border-2 border-ink' : 'bg-ink/[0.07]'
                )}
                style={{
                  height: `${h}%`,
                  background:
                    v > 0
                      ? `linear-gradient(to top, rgb(var(--tone)), rgb(var(${hit ? '--sun' : '--tone'}) / ${hit ? 1 : 0.65}))`
                      : undefined,
                  transitionDelay: `${i * 50}ms`,
                }}
                title={`${v} min`}
              />
              {hit && (
                <span className="absolute left-1/2 -translate-x-1/2 text-xs leading-none" style={{ bottom: `calc(${h}% + 2px)` }} aria-hidden>
                  ★
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {weekKeys.map((k) => (
          <span key={k} className="flex-1 flex justify-center">
            <span
              className={clsx(
                'text-[10px] uppercase font-bold nums h-[18px] w-[18px] grid place-items-center rounded-full',
                k === todayKey ? 'bg-ink text-white' : 'text-ink-mute'
              )}
            >
              {format(parseISO(k), 'EEEEE')}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
