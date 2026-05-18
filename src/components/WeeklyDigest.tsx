import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { summarizeWeek } from '@/lib/aggregate';
import { MEAL_SLOT_LABELS } from '@/types';
import type { Profile, WeekSummary } from '@/types';

const DISMISS_PREFIX = 'almanac:digestDismissed:';

export default function WeeklyDigest({ profile }: { profile: Profile }) {
  // last week's Monday
  const lastWeekKey = format(
    startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
    'yyyy-MM-dd'
  );

  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(DISMISS_PREFIX + lastWeekKey);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    summarizeWeek(lastWeekKey, profile).then((s) => {
      if (!cancelled) setSummary(s);
    });
    return () => {
      cancelled = true;
    };
  }, [lastWeekKey, profile]);

  if (dismissed || !summary) return null;

  const hasAnyData =
    summary.sleepNightsLogged > 0 ||
    summary.waterTotalMl > 0 ||
    summary.sportSessions > 0 ||
    summary.journalEntries > 0;

  if (!hasAnyData) return null;

  const weekRange = `${format(parseISO(summary.weekKey), 'd MMM')} – ${format(
    new Date(parseISO(summary.weekKey).getTime() + 6 * 24 * 60 * 60 * 1000),
    'd MMM'
  )}`;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_PREFIX + lastWeekKey, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <section
      className="reveal mb-6 border border-rule bg-paper-2/40 p-5 md:p-6"
      style={{ animationDelay: '20ms' }}
    >
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <div className="label">last week’s digest</div>
          <h2 className="font-display font-medium text-3xl md:text-4xl mt-1 leading-tight">
            The week of{' '}
            <span className="font-display-italic text-clay-deep">{weekRange}</span>
          </h2>
        </div>
        <button
          onClick={dismiss}
          className="text-[11px] uppercase tracking-[0.18em] text-ink-mute hover:text-ink"
          title="hide until next Monday"
        >
          ✕ dismiss
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
        <Column heading="the week was">
          <Stat
            label="avg sleep"
            value={summary.sleepAvgHours != null ? `${summary.sleepAvgHours.toFixed(1)}h` : '—'}
            sub={`${summary.sleepNightsLogged} nights logged`}
          />
          <Stat
            label="water"
            value={`${(summary.waterTotalMl / 1000).toFixed(1)}L`}
            sub={`${summary.waterDaysOnTarget}/7 on target`}
          />
          <Stat
            label="sport"
            value={`${summary.sportSessions}×`}
            sub={`${summary.sportMinutes}/${summary.sportTargetMinutes} min`}
          />
        </Column>

        <Column heading="high point">
          {summary.bestDayKey ? (
            <>
              <Stat
                label="best day"
                value={format(parseISO(summary.bestDayKey), 'EEEE')}
                sub={`score ${summary.bestDayScore}/100`}
                href={`/day/${summary.bestDayKey}`}
              />
              {summary.journalEntries > 0 && (
                <Stat
                  label="journal"
                  value={`${summary.journalEntries}`}
                  sub={`day${summary.journalEntries === 1 ? '' : 's'} written`}
                />
              )}
              {summary.weightDeltaKg != null && (
                <Stat
                  label="weight"
                  value={`${summary.weightDeltaKg > 0 ? '+' : ''}${summary.weightDeltaKg.toFixed(1)}kg`}
                  sub="vs prior weigh-in"
                />
              )}
            </>
          ) : (
            <p className="font-serif italic text-ink-mute">no entries logged this week.</p>
          )}
        </Column>

        <Column heading="watch this">
          {summary.mostMissedSlot && summary.sleepNightsLogged < 7 ? (
            <p className="font-serif text-ink leading-relaxed">
              You skipped <span className="font-display-italic text-clay-deep">{MEAL_SLOT_LABELS[summary.mostMissedSlot].toLowerCase()}</span> most
              often. Sleep was logged{' '}
              <span className="font-display nums text-ink">{summary.sleepNightsLogged}/7</span> nights.
            </p>
          ) : summary.sportSessions < profile.sportSessionsPerWeek ? (
            <p className="font-serif text-ink leading-relaxed">
              You hit{' '}
              <span className="font-display nums text-ink">{summary.sportSessions}/{profile.sportSessionsPerWeek}</span>{' '}
              sport sessions. A short walk counts.
            </p>
          ) : (
            <p className="font-serif italic text-moss-deep">
              Nothing to flag — a solid week. Keep going.
            </p>
          )}
        </Column>
      </div>
    </section>
  );
}

function Column({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label mb-3 border-t border-rule pt-3 md:border-t-0 md:pt-0">{heading}</div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="label">{label}</div>
      <div className="font-display text-2xl leading-none nums mt-1">{value}</div>
      {sub && <div className="text-xs text-ink-mute mt-0.5 nums">{sub}</div>}
    </>
  );
  if (href) {
    return (
      <Link to={href} className="block hover:text-clay-deep transition-colors">
        {body}
      </Link>
    );
  }
  return <div>{body}</div>;
}
