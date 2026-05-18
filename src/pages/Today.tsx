import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO, getDay, subDays } from 'date-fns';
import clsx from 'clsx';
import { db } from '@/db/schema';
import { todayKey, weekKeysFor, prettyLongDate, ordinal, hoursBetween, isWrapMidnight } from '@/lib/dates';
import {
  sleepFeedback,
  waterFeedback,
  mealsFeedback,
  sportFeedback,
  moodFeedback,
  scoreMealSlot,
  sleepDebt,
  type ScoredFeedback,
} from '@/lib/scoring';
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  type MealItem,
  type MealSlot,
  type Profile,
} from '@/types';
import Card from '@/components/Card';
import Slider from '@/components/Slider';
import ProgressRing from '@/components/ProgressRing';
import FeedbackStrip from '@/components/FeedbackStrip';
import MealRow from '@/components/MealRow';
import WeekBar from '@/components/WeekBar';
import Rule from '@/components/Rule';
import Greeting from '@/components/Greeting';
import WeightCard from '@/components/WeightCard';
import ExportBanner from '@/components/ExportBanner';
import StreakStrip from '@/components/StreakStrip';
import WeeklyDigest from '@/components/WeeklyDigest';

export default function Today() {
  const date = todayKey();
  const weekKeys = weekKeysFor(date);

  // Live data
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const day = useLiveQuery(() => db.days.get(date), [date]);
  const sleep = useLiveQuery(
    () => db.sleep.where('date').equals(date).last(),
    [date]
  );
  const meals = useLiveQuery(
    () => db.meals.where('date').equals(date).toArray(),
    [date]
  );
  const water = useLiveQuery(
    () => db.water.where('date').equals(date).toArray(),
    [date]
  );
  const workoutsToday = useLiveQuery(
    () => db.workouts.where('date').equals(date).toArray(),
    [date]
  );
  const workoutsWeek = useLiveQuery(
    () => db.workouts.where('date').anyOf(weekKeys).toArray(),
    [date]
  );
  const library = useLiveQuery(() => db.foodLibrary.toArray(), []);
  const last7Sleep = useLiveQuery(() => {
    const from = format(subDays(parseISO(date), 6), 'yyyy-MM-dd');
    return db.sleep.where('date').between(from, date, true, true).toArray();
  }, [date]);

  const waterMl = (water ?? []).reduce((s, w) => s + w.ml, 0);
  const totalSportToday = (workoutsToday ?? []).reduce((s, w) => s + w.durationMin, 0);
  const debtHours = useMemo(
    () => (profile && (last7Sleep?.length ?? 0) >= 3 ? sleepDebt(last7Sleep ?? [], profile.sleepTargetHours) : null),
    [last7Sleep, profile]
  );

  // ensure a meal row exists for each slot for clean editing
  const mealsBySlot = useMemo(() => {
    const m = new Map<MealSlot, (typeof meals extends (infer T)[] | undefined ? T : never) | undefined>();
    MEAL_SLOTS.forEach((s) => m.set(s, undefined));
    (meals ?? []).forEach((row) => m.set(row.slot, row));
    return m;
  }, [meals]);

  const feedback: ScoredFeedback[] = useMemo(() => {
    if (!profile) return [];
    const items: ScoredFeedback[] = [];
    items.push({ area: 'sleep', ...sleepFeedback(sleep?.hours, profile.sleepTargetHours) });
    items.push({ area: 'meals', ...mealsFeedback(meals ?? [], profile.dietStyle) });
    items.push({ area: 'water', ...waterFeedback(waterMl, profile.waterTargetMl) });

    // week progress fraction (Mon=0..Sun=6, with end-of-day)
    const dow = (getDay(parseISO(date)) + 6) % 7; // Mon=0
    const weekFrac = (dow + 1) / 7;
    items.push({
      area: 'sport',
      ...sportFeedback(workoutsWeek ?? [], profile, weekFrac),
    });
    items.push({ area: 'mood', ...moodFeedback(day?.mood, day?.energy, sleep?.hours) });
    return items;
  }, [sleep, meals, waterMl, workoutsWeek, day, profile, date]);

  if (!profile) return null; // will redirect via App

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-8">
      <ExportBanner />
      <WeeklyDigest profile={profile} />
      <Greeting name={profile.name} />
      <Masthead date={date} />
      <StreakStrip />
      <FeedbackStrip items={feedback} />

      <div className="grid grid-cols-12 gap-5 mt-8">
        {/* SLEEP */}
        <Card
          eyebrow="i. sleep"
          title="The Hours"
          className="col-span-12 md:col-span-4"
          style={{ animationDelay: '40ms' }}
        >
          <SleepBlock profile={profile} sleep={sleep} date={date} debtHours={debtHours} />
        </Card>

        {/* MEALS */}
        <Card
          eyebrow="ii. the table"
          title="Today’s Plate"
          className="col-span-12 md:col-span-5 row-span-2"
          style={{ animationDelay: '120ms' }}
          side={
            <span className="label">{profile.dietStyle.replace('-', ' ')}</span>
          }
        >
          {MEAL_SLOTS.map((slot) => {
            const m = mealsBySlot.get(slot);
            const score = m && m.items.length ? scoreMealSlot(m.items, profile.dietStyle) : 0;
            return (
              <MealRow
                key={slot}
                label={MEAL_SLOT_LABELS[slot]}
                meal={m}
                library={library ?? []}
                score={score}
                onChange={async (items) => {
                  await upsertMeal(date, slot, items);
                }}
              />
            );
          })}
        </Card>

        {/* WATER */}
        <Card
          eyebrow="iii. water"
          title="The Vessel"
          className="col-span-12 md:col-span-3"
          style={{ animationDelay: '200ms' }}
        >
          <WaterBlock profile={profile} ml={waterMl} date={date} />
        </Card>

        {/* MOOD/ENERGY */}
        <Card
          eyebrow="iv. constitution"
          title="Mood & Energy"
          className="col-span-12 md:col-span-4"
          style={{ animationDelay: '280ms' }}
        >
          <MoodBlock day={day} date={date} sleepHours={sleep?.hours} />
        </Card>

        {/* SPORT */}
        <Card
          eyebrow="v. sport"
          title="The Week’s Effort"
          className="col-span-12 md:col-span-3"
          style={{ animationDelay: '360ms' }}
        >
          <SportBlock
            profile={profile}
            workoutsWeek={workoutsWeek ?? []}
            workoutsToday={workoutsToday ?? []}
            totalSportToday={totalSportToday}
            weekKeys={weekKeys}
            date={date}
          />
        </Card>

        {/* WEIGHT */}
        <WeightCard profile={profile} date={date} />
      </div>

      <Rule label="journal" />
      <Card
        eyebrow="vi. dispatch"
        title="A Note for the Record"
        className="reveal"
        style={{ animationDelay: '440ms' }}
      >
        <textarea
          className="w-full bg-transparent outline-none font-serif text-lg leading-[1.7] text-ink min-h-[180px] dropcap resize-none"
          style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 50" }}
          placeholder="Today I noticed…"
          defaultValue={day?.journal ?? ''}
          onBlur={async (e) => {
            await upsertDay(date, { journal: e.target.value });
          }}
        />
      </Card>
    </div>
  );
}

/* ============== Sub-blocks ============== */

function Masthead({ date }: { date: string }) {
  const d = parseISO(date);
  const dayName = format(d, 'EEEE');
  const dayNum = ordinal(Number(format(d, 'd')));
  const monthYear = format(d, 'MMMM yyyy');

  return (
    <div className="reveal">
      <div className="label mb-3">{prettyLongDate(date)}</div>
      <h1 className="font-display font-medium text-[clamp(3.2rem,8vw,6.5rem)] leading-[0.92] tracking-tight">
        {dayName},
        <br />
        <span className="font-display-italic text-clay-deep">the {dayNum}</span>
        <span className="text-ink-soft"> of {monthYear}</span>
      </h1>
      <Rule />
    </div>
  );
}

function SleepBlock({
  profile,
  sleep,
  date,
  debtHours,
}: {
  profile: Profile;
  sleep: { hours: number; quality: number; bedtime?: string; wakeTime?: string } | undefined;
  date: string;
  debtHours: number | null;
}) {
  const [bedtime, setBedtime] = useState<string>(sleep?.bedtime ?? '');
  const [wakeTime, setWakeTime] = useState<string>(sleep?.wakeTime ?? '');
  const [quality, setQuality] = useState<number>(sleep?.quality ?? 3);

  useEffect(() => {
    setBedtime(sleep?.bedtime ?? '');
    setWakeTime(sleep?.wakeTime ?? '');
    setQuality(sleep?.quality ?? 3);
  }, [sleep?.bedtime, sleep?.wakeTime, sleep?.quality]);

  const derived = hoursBetween(bedtime, wakeTime);
  const hours = derived ?? sleep?.hours ?? 0;
  const target = profile.sleepTargetHours;
  const diff = hours ? hours - target : 0;
  const wraps = isWrapMidnight(bedtime, wakeTime);

  const commit = (nextBed: string, nextWake: string, nextQ: number) => {
    const h = hoursBetween(nextBed, nextWake) ?? 0;
    upsertSleep(date, { hours: h, quality: nextQ, bedtime: nextBed || undefined, wakeTime: nextWake || undefined });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3 mt-1">
        <span className="font-display font-medium text-[4.5rem] leading-none nums">
          {hours ? hours.toFixed(hours % 1 === 0 ? 0 : 1) : '—'}
        </span>
        <span className="font-display text-2xl text-ink-mute leading-none mb-2">h</span>
        <div className="ml-auto flex flex-col items-end gap-1">
          <span className="label nums">target {target}h</span>
          {debtHours != null && (
            <span
              className={clsx(
                'text-[10px] uppercase tracking-[0.18em] nums',
                debtHours >= 0
                  ? 'text-moss-deep'
                  : debtHours > -2
                  ? 'text-amber'
                  : 'text-clay-deep'
              )}
              title="rolling 7-day sleep debt vs. target"
            >
              {debtHours >= 0 ? '+' : ''}{debtHours.toFixed(1)}h · 7d
            </span>
          )}
        </div>
      </div>

      {hours > 0 && (
        <div className="text-xs">
          <span className={diff >= -0.5 ? 'text-moss-deep' : 'text-clay-deep'}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}h vs. target
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="label">bedtime</span>
          <input
            type="time"
            className="field nums font-display text-xl py-1"
            value={bedtime}
            onChange={(e) => {
              const v = e.target.value;
              setBedtime(v);
              commit(v, wakeTime, quality);
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">wake time</span>
          <input
            type="time"
            className="field nums font-display text-xl py-1"
            value={wakeTime}
            onChange={(e) => {
              const v = e.target.value;
              setWakeTime(v);
              commit(bedtime, v, quality);
            }}
          />
        </label>
      </div>

      {wraps && (
        <div className="text-[10px] uppercase tracking-[0.18em] text-ink-mute">
          ↻ wraps over midnight
        </div>
      )}

      <div className="border-t border-rule pt-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="label">quality</span>
          <span className="font-display text-lg leading-none nums">{quality}/5</span>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuality(q);
                commit(bedtime, wakeTime, q);
              }}
              className={`flex-1 h-2 transition-colors ${
                q <= quality ? 'bg-ink' : 'bg-rule'
              } hover:opacity-80`}
              aria-label={`Quality ${q}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WaterBlock({
  profile,
  ml,
  date,
}: {
  profile: Profile;
  ml: number;
  date: string;
}) {
  const target = profile.waterTargetMl;
  const pct = Math.min(1, ml / target);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <ProgressRing
          value={pct}
          size={150}
          stroke={5}
          label={`${(ml / 1000).toFixed(1)}L`}
          caption={`of ${(target / 1000).toFixed(1)}L`}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 w-full">
        {[200, 330, 500].map((v) => (
          <button
            key={v}
            className="tap"
            onClick={() => addWater(date, v)}
          >
            +{v}
          </button>
        ))}
      </div>
      <button
        className="text-xs text-ink-mute hover:text-clay-deep underline underline-offset-4 decoration-rule"
        onClick={() => undoLastWater(date)}
      >
        undo last sip
      </button>
    </div>
  );
}

function MoodBlock({
  day,
  date,
  sleepHours,
}: {
  day: { mood?: number; energy?: number; stress?: number } | undefined;
  date: string;
  sleepHours: number | undefined;
}) {
  const [mood, setMood] = useState(day?.mood ?? 3);
  const [energy, setEnergy] = useState(day?.energy ?? 3);
  const [stress, setStress] = useState(day?.stress ?? 3);

  useEffect(() => {
    setMood(day?.mood ?? 3);
    setEnergy(day?.energy ?? 3);
    setStress(day?.stress ?? 3);
  }, [day?.mood, day?.energy, day?.stress]);

  const expected = sleepHours == null ? null : Math.max(1, Math.min(5, Math.round(5 - Math.abs(sleepHours - 8))));

  const commit = (next: { mood?: number; energy?: number; stress?: number }) =>
    upsertDay(date, next);

  return (
    <div className="flex flex-col gap-5">
      <Slider
        label="mood"
        value={mood}
        onChange={(v) => { setMood(v); commit({ mood: v }); }}
        scaleLeft="dim"
        scaleRight="bright"
      />
      <Slider
        label="energy"
        value={energy}
        onChange={(v) => { setEnergy(v); commit({ energy: v }); }}
        scaleLeft="depleted"
        scaleRight="charged"
      />
      <Slider
        label="stress"
        value={stress}
        onChange={(v) => { setStress(v); commit({ stress: v }); }}
        scaleLeft="calm"
        scaleRight="tense"
      />
      {expected != null && (
        <div className="text-xs text-ink-mute border-t border-rule pt-3 leading-relaxed">
          based on {sleepHours?.toFixed(1)}h of sleep your <em>energy</em> would
          predict around <span className="font-medium text-ink">{expected}/5</span>.
        </div>
      )}
    </div>
  );
}

function SportBlock({
  profile,
  workoutsWeek,
  workoutsToday,
  totalSportToday,
  weekKeys,
  date,
}: {
  profile: Profile;
  workoutsWeek: { date: string; durationMin: number; sport: string; intensity: number }[];
  workoutsToday: { sport: string; durationMin: number }[];
  totalSportToday: number;
  weekKeys: string[];
  date: string;
}) {
  const [sport, setSport] = useState('');
  const [duration, setDuration] = useState(30);

  const sessions = workoutsWeek.length;
  const targetSessions = profile.sportSessionsPerWeek;
  const targetMin = targetSessions * profile.sportMinutesPerSession;
  const totalMin = workoutsWeek.reduce((s, w) => s + w.durationMin, 0);

  // bar series: minutes per day
  const series = weekKeys.map(
    (k) => workoutsWeek.filter((w) => w.date === k).reduce((s, w) => s + w.durationMin, 0)
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-display font-medium text-3xl leading-none nums">
            {sessions}
            <span className="text-ink-mute">/{targetSessions}</span>
          </div>
          <div className="label mt-1">sessions this week</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl leading-none nums">{totalMin}m</div>
          <div className="label mt-1">of {targetMin}m goal</div>
        </div>
      </div>

      <WeekBar weekKeys={weekKeys} values={series} target={targetMin} todayKey={date} />

      <div className="border-t border-rule pt-3 flex flex-col gap-2">
        <div className="label">log a session</div>
        <input
          className="field"
          placeholder="sport (run, yoga, cycling…)"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="field flex-1"
            min={5}
            max={300}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <span className="label">min</span>
          <button
            className="btn-ink"
            disabled={!sport.trim()}
            onClick={async () => {
              await db.workouts.add({
                date,
                sport: sport.trim(),
                durationMin: duration,
                intensity: 3,
              });
              setSport('');
              setDuration(30);
            }}
          >
            log
          </button>
        </div>
        {workoutsToday.length > 0 && (
          <ul className="text-xs text-ink-soft mt-1 space-y-0.5">
            {workoutsToday.map((w, i) => (
              <li key={i} className="flex justify-between">
                <span>· {w.sport}</span>
                <span className="nums text-ink-mute">{w.durationMin}m</span>
              </li>
            ))}
            {totalSportToday > 0 && (
              <li className="flex justify-between border-t border-rule pt-1 mt-1">
                <span className="label">today</span>
                <span className="nums">{totalSportToday}m</span>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ============== Persistence helpers ============== */

async function upsertMeal(date: string, slot: MealSlot, items: MealItem[]) {
  const existing = await db.meals.where({ date, slot }).first();
  const updatedAt = Date.now();
  if (existing?.id != null) {
    await db.meals.update(existing.id, { items, updatedAt });
  } else {
    await db.meals.add({ date, slot, items, updatedAt });
  }
}

type SleepPatch = { hours: number; quality: number; bedtime?: string; wakeTime?: string };

async function upsertSleep(date: string, patch: SleepPatch | number, q?: number) {
  // Back-compat: callers used to pass (date, hours, quality)
  const data: SleepPatch =
    typeof patch === 'number' ? { hours: patch, quality: q ?? 3 } : patch;
  const existing = await db.sleep.where('date').equals(date).first();
  const updatedAt = Date.now();
  if (existing?.id != null) {
    await db.sleep.update(existing.id, { ...data, updatedAt });
  } else {
    await db.sleep.add({ date, ...data, updatedAt });
  }
}

async function addWater(date: string, ml: number) {
  await db.water.add({ date, ml, time: Date.now() });
}

async function undoLastWater(date: string) {
  const last = await db.water.where('date').equals(date).last();
  if (last?.id != null) await db.water.delete(last.id);
}

async function upsertDay(date: string, patch: Partial<{ mood: number; energy: number; stress: number; journal: string }>) {
  const now = Date.now();
  const existing = await db.days.get(date);
  if (existing) {
    await db.days.update(date, { ...patch, updatedAt: now });
  } else {
    await db.days.add({
      date,
      mood: 3,
      energy: 3,
      stress: 3,
      journal: '',
      ...patch,
      createdAt: now,
      updatedAt: now,
    });
  }
}
