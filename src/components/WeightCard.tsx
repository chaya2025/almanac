import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import clsx from 'clsx';
import { db } from '@/db/schema';
import {
  bmi,
  bmiBand,
  delta,
  daysSinceLast,
  fmtKg,
  isSunday,
  latest,
} from '@/lib/weight';
import type { Profile } from '@/types';
import Card from './Card';

type Props = { profile: Profile; date: string };

export default function WeightCard({ profile, date }: Props) {
  const weights = useLiveQuery(
    () => db.weights.orderBy('date').toArray(),
    []
  );
  const [draft, setDraft] = useState<string>('');
  const [editing, setEditing] = useState(false);

  const sundayToday = isSunday(date);
  const last = latest(weights ?? []);
  const change = delta(weights ?? []);
  const since = daysSinceLast(weights ?? []);
  const todayEntry = (weights ?? []).find((w) => w.date === date);
  const showWeighIn = sundayToday && !todayEntry;
  const b = bmi(last?.kg, profile.heightCm);
  const band = bmiBand(b);

  const submit = async () => {
    const kg = parseFloat(draft);
    if (!kg || kg <= 0) return;
    const existing = await db.weights.where('date').equals(date).first();
    if (existing?.id != null) {
      await db.weights.update(existing.id, { kg });
    } else {
      await db.weights.add({ date, kg, createdAt: Date.now() });
    }
    setDraft('');
    setEditing(false);
  };

  const eyebrow = showWeighIn ? '★ sunday weigh-in' : 'vii. weight';
  const title = showWeighIn ? 'Step on the scale' : 'The Scale';

  return (
    <Card
      eyebrow={eyebrow}
      title={title}
      className={clsx(
        'col-span-12 md:col-span-4 reveal',
        showWeighIn && 'ring-1 ring-clay/40'
      )}
      style={{ animationDelay: '440ms' }}
      side={
        last && (
          <span className="label nums">
            {since === 0 ? 'logged today' : since === 1 ? 'yesterday' : `${since}d ago`}
          </span>
        )
      }
    >
      {showWeighIn || editing || !last ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="300"
              autoFocus
              className="field font-display text-5xl nums w-32"
              placeholder={last ? last.kg.toFixed(1) : '60.0'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') {
                  setDraft('');
                  setEditing(false);
                }
              }}
            />
            <span className="font-display text-2xl text-ink-mute mb-2">kg</span>
            <button
              className="btn-ink ml-auto mb-1"
              onClick={submit}
              disabled={!draft}
            >
              log
            </button>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            {showWeighIn
              ? 'It’s Sunday — your weekly weigh-in. Same scale, same time of day if you can.'
              : 'Add today’s weight. The chart will pick it up immediately.'}
          </p>
          {last && (
            <button
              className="text-xs text-ink-mute hover:text-ink underline underline-offset-4 decoration-rule"
              onClick={() => setEditing(false)}
            >
              cancel
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <span className="font-display font-medium text-[5rem] leading-none nums">
              {last.kg.toFixed(1)}
            </span>
            <span className="font-display text-2xl text-ink-mute leading-none mb-2">kg</span>
            {change != null && (
              <span
                className={clsx(
                  'ml-auto label nums mb-2',
                  change < 0 ? 'text-moss-deep' : change > 0 ? 'text-clay-deep' : 'text-ink-mute'
                )}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}kg
              </span>
            )}
          </div>
          {b != null && band && (
            <div className="border-t border-rule pt-3 flex items-baseline justify-between text-sm">
              <span className="label">BMI</span>
              <span className="font-display nums">
                {b}
                <span
                  className={clsx(
                    'ml-2 text-xs uppercase tracking-[0.18em]',
                    band.tone === 'good' && 'text-moss-deep',
                    band.tone === 'warn' && 'text-amber',
                    band.tone === 'bad' && 'text-clay-deep'
                  )}
                >
                  {band.label}
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-ink-mute">
              next weigh-in: <span className="text-ink-soft">{nextSundayLabel(date)}</span>
            </span>
            <button className="btn-ghost" onClick={() => setEditing(true)}>
              re-log
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function nextSundayLabel(date: string): string {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 0) return 'today';
  const diff = 7 - day;
  return diff === 1 ? 'tomorrow' : `in ${diff} days`;
}
