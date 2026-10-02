import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO, startOfWeek, addDays, subDays } from 'date-fns';
import clsx from 'clsx';
import { db } from '@/db/schema';
import { todayKey } from '@/lib/dates';
import Rule from '@/components/Rule';

const WEEKS = 26; // ~6 months


// mood 1..5: oxblood → terracotta → ochre → sage → forest
const MOOD_COLORS = [
  'rgb(150 60 52 / 0.85)',
  'rgb(184 92 56 / 0.75)',
  'rgb(184 140 52 / 0.7)',
  'rgb(120 150 100 / 0.8)',
  'rgb(74 118 82 / 0.9)',
];

export default function History() {
  const today = todayKey();
  const startCol = startOfWeek(subDays(parseISO(today), (WEEKS - 1) * 7), { weekStartsOn: 1 });
  const start = format(startCol, 'yyyy-MM-dd');

  const days = useLiveQuery(
    () => db.days.where('date').between(start, today, true, true).toArray(),
    [start, today]
  );

  const byDate = useMemo(() => new Map((days ?? []).map((d) => [d.date, d])), [days]);

  const columns = useMemo(() => {
    const cols: { date: string; mood?: number; isToday: boolean; isFuture: boolean }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col: { date: string; mood?: number; isToday: boolean; isFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = format(addDays(startCol, w * 7 + d), 'yyyy-MM-dd');
        col.push({
          date,
          mood: byDate.get(date)?.mood,
          isToday: date === today,
          isFuture: date > today,
        });
      }
      cols.push(col);
    }
    return cols;
  }, [startCol, byDate, today]);

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = '';
    columns.forEach((col, i) => {
      const m = format(parseISO(col[0].date), 'MMM');
      if (m !== lastMonth) {
        labels.push({ col: i, label: m });
        lastMonth = m;
      }
    });
    return labels;
  }, [columns]);

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
      <div className="reveal">
        <div className="label">section iii.</div>
        <h1 className="font-display font-normal text-5xl md:text-6xl mt-1 tracking-[-0.02em]">
          Days, <span className="font-display-italic text-clay-deep">past</span>
        </h1>
        <Rule />
      </div>

      <div className="reveal">
        <div className="flex items-baseline justify-between mb-3">
          <div className="label">last six months · click any square</div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink-mute">
            <span>low</span>
            <div className="flex gap-0.5">
              {MOOD_COLORS.map((c) => (
                <div key={c} className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>bright</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex flex-col gap-1 min-w-full">
            <div
              className="grid"
              style={{ gridTemplateColumns: `2.25rem repeat(${WEEKS}, 1fr)`, columnGap: '4px' }}
            >
              <div />
              {Array.from({ length: WEEKS }, (_, i) => {
                const m = monthLabels.find((x) => x.col === i);
                return (
                  <div key={i} className="label text-[9px]">
                    {m?.label ?? ''}
                  </div>
                );
              })}
            </div>

            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div
                key={row}
                className="grid items-center"
                style={{ gridTemplateColumns: `2.25rem repeat(${WEEKS}, 1fr)`, columnGap: '4px' }}
              >
                <div className="label text-[9px] text-right pr-2">
                  {['mon', '', 'wed', '', 'fri', '', 'sun'][row]}
                </div>
                {columns.map((col, ci) => (
                  <Cell key={ci} cell={col[row]} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Rule />
      <div className="reveal text-sm text-ink-soft max-w-prose">
        Each square is one day, shaded by your mood reading. Click to open that day’s entry — log
        what you remember, anytime.
      </div>
    </div>
  );
}

function Cell({
  cell,
}: {
  cell: { date: string; mood?: number; isToday: boolean; isFuture: boolean };
}) {
  if (cell.isFuture) return <div className="aspect-square" />;
  const bg = cell.mood == null ? 'rgb(var(--paper-2) / 0.7)' : MOOD_COLORS[Math.max(0, Math.min(4, Math.round(cell.mood) - 1))];
  return (
    <Link
      to={`/day/${cell.date}`}
      title={`${format(parseISO(cell.date), 'EEEE d MMM')} · mood ${cell.mood ?? '–'}/5`}
      className={clsx(
        'aspect-square rounded-[4px] transition-all hover:scale-110 hover:z-10 relative',
        cell.isToday ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : 'hover:ring-1 hover:ring-ink/40'
      )}
      style={{ backgroundColor: bg }}
    />
  );
}
