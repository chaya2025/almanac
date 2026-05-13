import type { ScoredFeedback } from '@/lib/scoring';
import clsx from 'clsx';

const dotColor: Record<ScoredFeedback['severity'], string> = {
  good: 'bg-moss',
  warn: 'bg-amber',
  bad: 'bg-clay',
};

export default function FeedbackStrip({ items }: { items: ScoredFeedback[] }) {
  return (
    <div className="border-y border-rule py-3">
      <div className="flex flex-wrap gap-x-8 gap-y-2 items-center">
        <span className="label shrink-0">today’s reading</span>
        {items.map((f, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span className={clsx('h-2 w-2 rounded-full shrink-0', dotColor[f.severity])} />
            <span className="text-[13px] text-ink-soft truncate">
              <span className="label mr-2">{f.area}</span>
              {f.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
