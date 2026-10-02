import type { ScoredFeedback } from '@/lib/scoring';
import clsx from 'clsx';

const areaTone: Record<string, string> = {
  sleep: 'tone-night',
  meals: 'tone-tang',
  water: 'tone-aqua',
  sport: 'tone-leaf',
  mood: 'tone-pink',
};

const severityMark: Record<ScoredFeedback['severity'], { glyph: string; cls: string }> = {
  good: { glyph: '✓', cls: 'bg-moss text-white' },
  warn: { glyph: '!', cls: 'bg-amber text-ink' },
  bad: { glyph: '×', cls: 'bg-clay text-white' },
};

export default function FeedbackStrip({ items }: { items: ScoredFeedback[] }) {
  return (
    <div className="reveal" style={{ animationDelay: '60ms' }}>
      <div className="label mb-2">today’s reading</div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.map((f, i) => {
          const mark = severityMark[f.severity];
          return (
            <div
              key={i}
              className={clsx(
                areaTone[f.area] ?? 'tone-sun',
                'snap-start shrink-0 w-[230px] md:flex-1 md:w-auto md:min-w-[180px] bg-tone-soft border-2 border-ink rounded-2xl px-3 py-2.5 shadow-pop-sm'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-[0.16em] font-extrabold">{f.area}</span>
                <span className={clsx('h-5 w-5 rounded-full border-2 border-ink grid place-items-center text-[11px] font-black leading-none', mark.cls)}>
                  {mark.glyph}
                </span>
              </div>
              <p className="text-[13px] text-ink-soft leading-snug">{f.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
