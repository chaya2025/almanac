import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import clsx from 'clsx';
import { db } from '@/db/schema';
import Card from '@/components/Card';
import Rule from '@/components/Rule';
import SleepChart from '@/components/charts/SleepChart';
import MealsChart from '@/components/charts/MealsChart';
import WaterChart from '@/components/charts/WaterChart';
import SportChart from '@/components/charts/SportChart';
import MoodChart from '@/components/charts/MoodChart';
import WeightChart from '@/components/charts/WeightChart';
import SleepDebtMeter from '@/components/charts/SleepDebtMeter';
import { sleepDebt } from '@/lib/scoring';
import {
  aggregateMeals,
  aggregateMoodSleep,
  aggregateSleep,
  aggregateSport,
  aggregateWater,
  pearson,
  pairCount,
  MIN_PAIRS,
  rangeForGranularity,
  type Granularity,
} from '@/lib/aggregate';
import { trendSeries } from '@/lib/weight';

const TABS: { v: Granularity; label: string; sub: string }[] = [
  { v: 'daily', label: 'Daily', sub: 'last 30 days' },
  { v: 'weekly', label: 'Weekly', sub: 'last 12 weeks' },
  { v: 'monthly', label: 'Monthly', sub: 'last 12 months' },
];

export default function Trends() {
  const [g, setG] = useState<Granularity>('daily');
  const range = rangeForGranularity(g);
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const sleep = useLiveQuery(
    () => db.sleep.where('date').between(range.from, range.to, true, true).toArray(),
    [range.from, range.to]
  );
  const meals = useLiveQuery(
    () => db.meals.where('date').between(range.from, range.to, true, true).toArray(),
    [range.from, range.to]
  );
  const water = useLiveQuery(
    () => db.water.where('date').between(range.from, range.to, true, true).toArray(),
    [range.from, range.to]
  );
  const sport = useLiveQuery(
    () => db.workouts.where('date').between(range.from, range.to, true, true).toArray(),
    [range.from, range.to]
  );
  const days = useLiveQuery(
    () => db.days.where('date').between(range.from, range.to, true, true).toArray(),
    [range.from, range.to]
  );
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), []);
  // fixed 30-day window for sleep debt and patterns, independent of the tab
  const d30 = rangeForGranularity('daily');
  const last30Sleep = useLiveQuery(() => db.sleep.where('date').between(d30.from, d30.to, true, true).toArray(), [d30.from, d30.to]);
  const last30Days = useLiveQuery(() => db.days.where('date').between(d30.from, d30.to, true, true).toArray(), [d30.from, d30.to]);
  const last30Sport = useLiveQuery(() => db.workouts.where('date').between(d30.from, d30.to, true, true).toArray(), [d30.from, d30.to]);

  const sleepSeries = useMemo(() => aggregateSleep(sleep ?? [], g), [sleep, g]);
  const mealsSeries = useMemo(() => aggregateMeals(meals ?? [], g), [meals, g]);
  const waterSeries = useMemo(() => aggregateWater(water ?? [], g), [water, g]);
  const sportSeries = useMemo(() => aggregateSport(sport ?? [], g), [sport, g]);
  const moodSeries = useMemo(
    () => aggregateMoodSleep(days ?? [], sleep ?? [], g),
    [days, sleep, g]
  );
  const weightSeries = useMemo(() => trendSeries(weights ?? []), [weights]);

  // Sleep debt: last 7 nights, computed from the full sleep set in range
  const last7Sleep = useMemo(() => {
    const from = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    return (last30Sleep ?? []).filter((s) => s.date >= from);
  }, [last30Sleep]);
  const debt = useMemo(
    () => (profile && last7Sleep.length >= 3 ? sleepDebt(last7Sleep, profile.sleepTargetHours) : null),
    [last7Sleep, profile]
  );

  // Patterns are always read day-by-day over the last 30 days, whatever tab is open:
  // "next-day energy" only makes sense per day, not per week or month.
  const dailyMood = useMemo(
    () => aggregateMoodSleep(last30Days ?? [], last30Sleep ?? [], 'daily'),
    [last30Days, last30Sleep]
  );
  const dailySport = useMemo(() => aggregateSport(last30Sport ?? [], 'daily'), [last30Sport]);
  const corrSleepEnergy = useMemo(() => {
    const sleepXs = dailyMood.slice(0, -1).map((p) => p.sleepHours);
    const energyYs = dailyMood.slice(1).map((p) => p.energy);
    return { r: pearson(sleepXs, energyYs, MIN_PAIRS), n: pairCount(sleepXs, energyYs) };
  }, [dailyMood]);
  const corrSportEnergy = useMemo(() => {
    const map = new Map(dailySport.map((s) => [s.date, s.minutes]));
    const sportXs = dailyMood.map((m) => (m.energy == null ? null : map.get(m.date) ?? 0));
    const energyYs = dailyMood.map((p) => p.energy);
    return { r: pearson(sportXs, energyYs, MIN_PAIRS), n: pairCount(sportXs, energyYs) };
  }, [dailySport, dailyMood]);

  if (!profile) return null;

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
      <div className="reveal grid md:grid-cols-[1.25fr_1fr] gap-6 md:gap-10 items-end">
        <div className="order-2 md:order-1">
          <div className="label">section ii.</div>
          <h1 className="font-display font-normal text-5xl md:text-6xl mt-1 tracking-[-0.02em]">
            Trends, <span className="font-display-italic text-night">over time</span>
          </h1>
          <p className="text-ink-soft mt-3 max-w-md leading-relaxed">
            How your sleep, plate, water, effort and mood move together, day by day.
          </p>
        </div>
        <figure className="order-1 md:order-2 h-36 md:h-48 rounded-2xl overflow-hidden ring-1 ring-rule">
          <img src="/images/trends.webp" alt="An open notebook with glasses" className="w-full h-full object-cover" style={{ filter: 'saturate(0.85)' }} />
        </figure>
        <div className="order-3 md:col-span-2"><Rule className="!my-2" /></div>
      </div>

      <div className="reveal flex flex-wrap items-end gap-1 mb-8 border-b border-rule pb-4">
        {TABS.map((t) => {
          const active = t.v === g;
          return (
            <button
              key={t.v}
              onClick={() => setG(t.v)}
              className={clsx(
                'group flex flex-col items-start px-4 py-2 border-b-2 -mb-[17px] transition-colors',
                active ? 'border-clay text-ink' : 'border-transparent text-ink-mute hover:text-ink'
              )}
            >
              <span className="font-display text-2xl leading-none">{t.label}</span>
              <span className="label mt-1">{t.sub}</span>
            </button>
          );
        })}
        <div className="ml-auto label nums hidden md:block">
          {range.from} → {range.to}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Card eyebrow="i. sleep" title="The Hours" className="col-span-12 md:col-span-7 reveal" style={{ animationDelay: '40ms' }}>
          <SleepChart data={sleepSeries} target={profile.sleepTargetHours} granularity={g} height={240} />
        </Card>

        <Card
          eyebrow="vii. weight"
          title="The Scale"
          className="col-span-12 md:col-span-5 reveal"
          style={{ animationDelay: '80ms' }}
          side={
            weightSeries.length >= 2 && (
              <span className="label nums">
                {(weightSeries[weightSeries.length - 1].kg - weightSeries[0].kg).toFixed(1)}kg since first
              </span>
            )
          }
        >
          <WeightChart data={weightSeries} height={240} />
        </Card>

        <Card
          eyebrow="i.b sleep debt"
          title="The Sleep Ledger"
          className="col-span-12 reveal"
          style={{ animationDelay: '120ms' }}
        >
          {debt == null ? (
            <div className="font-serif italic text-ink-mute py-6 text-center">
              log at least 3 nights of sleep this week to see your balance.
            </div>
          ) : (
            <SleepDebtMeter debt={debt} />
          )}
        </Card>

        <Card
          eyebrow="ii. the table"
          title="Plate Composition"
          className="col-span-12 md:col-span-7 reveal"
          style={{ animationDelay: '160ms' }}
          side={<span className="label">{profile.dietStyle.replace('-', ' ')}</span>}
        >
          <MealsChart data={mealsSeries} granularity={g} height={240} />
        </Card>

        <Card eyebrow="iii. water" title="The Vessel" className="col-span-12 md:col-span-5 reveal" style={{ animationDelay: '200ms' }}>
          <WaterChart data={waterSeries} targetMl={profile.waterTargetMl} granularity={g} height={240} />
        </Card>

        <Card eyebrow="v. sport" title="Effort over time" className="col-span-12 md:col-span-7 reveal" style={{ animationDelay: '280ms' }}>
          <SportChart
            data={sportSeries}
            weeklyTargetMin={profile.sportSessionsPerWeek * profile.sportMinutesPerSession}
            granularity={g}
            height={240}
          />
        </Card>

        <Card
          eyebrow="iv. constitution"
          title="Mood, Energy & Sleep"
          className="col-span-12 md:col-span-5 reveal"
          style={{ animationDelay: '320ms' }}
        >
          <MoodChart data={moodSeries} granularity={g} height={240} />
        </Card>

        <Card eyebrow="vi. patterns" title="What goes with what" className="col-span-12 reveal" style={{ animationDelay: '400ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CorrelationCard
              label="sleep → next-day energy"
              r={corrSleepEnergy.r}
              n={corrSleepEnergy.n}
              hintGood="more sleep tends to lift the next day's energy"
              hintBad="energy doesn't track sleep here — look at meals or stress"
              hintNone="needs 10 days with both sleep and next-day energy logged"
            />
            <CorrelationCard
              label="sport ↔ energy"
              r={corrSportEnergy.r}
              n={corrSportEnergy.n}
              hintGood="active days tend to be higher-energy days"
              hintBad="energy lags after sport here — consider rest"
              hintNone="needs 10 days with energy logged"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function CorrelationCard({
  label,
  r,
  n,
  hintGood,
  hintBad,
  hintNone,
}: {
  label: string;
  r: number | null;
  n: number;
  hintGood: string;
  hintBad: string;
  hintNone: string;
}) {
  const tone =
    r == null ? 'text-ink-mute' :
    r >= 0.3 ? 'text-moss-deep' :
    r <= -0.3 ? 'text-clay-deep' :
    'text-ink-soft';
  const hint =
    r == null ? hintNone :
    r >= 0.3 ? hintGood :
    r <= -0.3 ? hintBad :
    'a weak relationship — neither pulls strongly on the other.';
  return (
    <div className="rounded-xl border border-rule p-4 bg-paper/60">
      <div className="label">{label}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className={clsx('font-display font-normal text-5xl leading-none nums', tone)}>
          {r == null ? '—' : (r > 0 ? '+' : '') + r.toFixed(2)}
        </span>
        <span className="label">correlation · {n} days</span>
      </div>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">{hint}</p>
    </div>
  );
}
