import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { db } from '@/db/schema';
import { todayKey, prettyLongDate } from '@/lib/dates';
import {
  scoreSleep,
  scoreSportWeekly,
  scoreMealsForDay,
  scoreWater,
} from '@/lib/scoring';
import { weekKeysFor, formatTime } from '@/lib/dates';
import Rule from '@/components/Rule';
import Card from '@/components/Card';
import { MEAL_SLOTS, MEAL_SLOT_LABELS, type MealEntry, type MealSlot } from '@/types';

export default function DayView() {
  const { date = todayKey() } = useParams();
  const nav = useNavigate();
  const isToday = date === todayKey();
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const day = useLiveQuery(() => db.days.get(date), [date]);
  const sleep = useLiveQuery(() => db.sleep.where('date').equals(date).last(), [date]);
  const meals = useLiveQuery(() => db.meals.where('date').equals(date).toArray(), [date]);
  const water = useLiveQuery(() => db.water.where('date').equals(date).toArray(), [date]);
  const workoutsToday = useLiveQuery(() => db.workouts.where('date').equals(date).toArray(), [date]);
  const workoutsWeek = useLiveQuery(
    () => db.workouts.where('date').anyOf(weekKeysFor(date)).toArray(),
    [date]
  );
  const weight = useLiveQuery(() => db.weights.where('date').equals(date).first(), [date]);

  if (!profile) return null;

  const waterMl = (water ?? []).reduce((s, w) => s + w.ml, 0);
  const sleepScore = scoreSleep(sleep?.hours, profile.sleepTargetHours);
  const mealScore = scoreMealsForDay(meals ?? [], profile.dietStyle);
  const waterScore = scoreWater(waterMl, profile.waterTargetMl);
  const sportScore = scoreSportWeekly(workoutsWeek ?? [], profile);

  const prev = format(subDays(parseISO(date), 1), 'yyyy-MM-dd');
  const next = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
  const today = todayKey();

  const mealsBySlot = new Map<MealSlot, MealEntry | undefined>();
  MEAL_SLOTS.forEach((s) => mealsBySlot.set(s, undefined));
  (meals ?? []).forEach((m) => mealsBySlot.set(m.slot, m));

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-8">
      <nav className="reveal flex items-center justify-between mb-4">
        <Link to={`/day/${prev}`} className="btn-ghost">
          ← {format(parseISO(prev), 'EEE d MMM')}
        </Link>
        <Link to="/history" className="label hover:text-ink">↑ history</Link>
        {next <= today ? (
          <Link to={`/day/${next}`} className="btn-ghost">
            {format(parseISO(next), 'EEE d MMM')} →
          </Link>
        ) : (
          <span className="label">— end of chronicle —</span>
        )}
      </nav>

      <div className="reveal">
        <div className="label mb-3">{prettyLongDate(date)}</div>
        <h1 className="font-display font-medium text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
          {format(parseISO(date), 'EEEE')},
          <br />
          <span className="font-display-italic text-clay-deep">
            the {format(parseISO(date), 'do')}
          </span>
          <span className="text-ink-soft"> of {format(parseISO(date), 'MMMM yyyy')}</span>
        </h1>
        <Rule />
      </div>

      {isToday && (
        <div className="mb-5 reveal">
          <button className="btn-ink" onClick={() => nav('/')}>
            edit on today’s page →
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        <Card eyebrow="i. sleep" title="The Hours" className="col-span-12 md:col-span-4 reveal" style={{ animationDelay: '40ms' }}>
          {sleep ? (
            <div>
              <div className="font-display text-6xl nums">{sleep.hours.toFixed(1)}<span className="text-2xl text-ink-mute">h</span></div>
              {(sleep.bedtime || sleep.wakeTime) && (
                <div className="label mt-2 nums">
                  {formatTime(sleep.bedtime, profile.timeFormat ?? '24h')} → {formatTime(sleep.wakeTime, profile.timeFormat ?? '24h')}
                </div>
              )}
              <div className="label mt-2">quality {sleep.quality}/5 · score {sleepScore}</div>
            </div>
          ) : (
            <Empty>No sleep was logged this day.</Empty>
          )}
        </Card>

        <Card eyebrow="ii. the table" title="The Plate" className="col-span-12 md:col-span-5 reveal" style={{ animationDelay: '120ms' }}>
          {(meals ?? []).length === 0 ? (
            <Empty>No meals were logged.</Empty>
          ) : (
            <div className="divide-y divide-rule">
              {MEAL_SLOTS.map((slot) => {
                const m = mealsBySlot.get(slot);
                return (
                  <div key={slot} className="py-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-lg">{MEAL_SLOT_LABELS[slot]}</span>
                      <span className="label">{m?.items.length ? `${m.items.length} item${m.items.length > 1 ? 's' : ''}` : '—'}</span>
                    </div>
                    {m?.items.length ? (
                      <ul className="text-sm text-ink-soft mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        {m.items.map((it, i) => (
                          <li key={i}>· {it.name}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
              <div className="pt-2 label">day score · {mealScore}/100</div>
            </div>
          )}
        </Card>

        <Card eyebrow="iii. water" title="The Vessel" className="col-span-12 md:col-span-3 reveal" style={{ animationDelay: '200ms' }}>
          <div className="font-display text-5xl nums">{(waterMl / 1000).toFixed(1)}<span className="text-2xl text-ink-mute">L</span></div>
          <div className="label mt-2 nums">of {(profile.waterTargetMl / 1000).toFixed(1)}L · score {waterScore}</div>
        </Card>

        <Card eyebrow="iv. constitution" title="Mood & Energy" className="col-span-12 md:col-span-4 reveal" style={{ animationDelay: '280ms' }}>
          {day && (day.mood != null || day.energy != null) ? (
            <dl className="grid grid-cols-3 gap-2">
              <Stat k="mood" v={day.mood ?? '—'} />
              <Stat k="energy" v={day.energy ?? '—'} />
              <Stat k="stress" v={day.stress ?? '—'} />
            </dl>
          ) : (
            <Empty>Mood was not logged.</Empty>
          )}
        </Card>

        <Card eyebrow="v. sport" title="The Day’s Effort" className="col-span-12 md:col-span-4 reveal" style={{ animationDelay: '320ms' }}>
          {(workoutsToday ?? []).length === 0 ? (
            <Empty>No sessions on this day.</Empty>
          ) : (
            <ul className="text-sm divide-y divide-rule">
              {workoutsToday!.map((w, i) => (
                <li key={i} className="py-1.5 flex justify-between">
                  <span>{w.sport}</span>
                  <span className="nums text-ink-mute">{w.durationMin}m · int {w.intensity}/5</span>
                </li>
              ))}
              <li className="pt-2 label">week score · {sportScore}/100</li>
            </ul>
          )}
        </Card>

        <Card eyebrow="vii. weight" title="The Scale" className="col-span-12 md:col-span-4 reveal" style={{ animationDelay: '360ms' }}>
          {weight ? (
            <div className="font-display text-5xl nums">{weight.kg.toFixed(1)}<span className="text-2xl text-ink-mute">kg</span></div>
          ) : (
            <Empty>No weigh-in this day.</Empty>
          )}
        </Card>
      </div>

      <Rule label="journal" />
      <Card eyebrow="vi. dispatch" title="Note for the Record" className="reveal" style={{ animationDelay: '440ms' }}>
        {day?.journal ? (
          <p className="font-serif text-lg leading-[1.75] text-ink dropcap whitespace-pre-wrap">
            {day.journal}
          </p>
        ) : (
          <Empty>No journal entry.</Empty>
        )}
      </Card>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="font-serif italic text-ink-mute text-sm">{children}</div>;
}

function Stat({ k, v }: { k: string; v: number | string }) {
  return (
    <div>
      <div className="label">{k}</div>
      <div className="font-display text-3xl nums">{v}<span className="text-base text-ink-mute">/5</span></div>
    </div>
  );
}
