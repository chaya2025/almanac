import type { ScoredFeedback } from '@/lib/scoring';
import clsx from 'clsx';

const areaTone: Record<string, string> = {
  sleep: 'tone-night',
  meals: 'tone-tang',
  water: 'tone-aqua',
  sport: 'tone-leaf',
  mood: 'tone-pink',
};

const severityDot: Record<ScoredFeedback['severity'], string> = {
  good: 'bg-moss',
  warn: 'bg-amber',
  bad: 'bg-clay-deep',
};

export default function FeedbackStrip({ items, label = 'today’s reading' }: { items: ScoredFeedback[]; label?: string }) {
  return (
    <div className="reveal" style={{ animationDelay: '60ms' }}>
      <div className="label mb-3">{label}</div>
      <div className="grid grid-flow-col auto-cols-[minmax(200px,1fr)] gap-3 overflow-x-auto pb-1 snap-x">
        {items.map((f, i) => (
          <div
            key={i}
            className={clsx(
              areaTone[f.area] ?? 'tone-ink',
              'snap-start bg-white/80 border border-rule rounded-xl px-4 py-3 border-l-[3px] border-l-tone'
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-tone">{f.area}</span>
              <span className={clsx('h-1.5 w-1.5 rounded-full', severityDot[f.severity])} title={f.severity} />
            </div>
            <p className="text-[13px] text-ink-soft leading-snug">{f.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
