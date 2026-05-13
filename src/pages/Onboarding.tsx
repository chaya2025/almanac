import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/db/schema';
import type { ActivityLevel, DietStyle, HealthGoal, Profile } from '@/types';
import Rule from '@/components/Rule';
import clsx from 'clsx';

type Step =
  | 'welcome'
  | 'you'
  | 'goal'
  | 'diet'
  | 'activity'
  | 'targets'
  | 'finish';

const ORDER: Step[] = ['welcome', 'you', 'goal', 'diet', 'activity', 'targets', 'finish'];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [draft, setDraft] = useState<Partial<Profile>>({
    name: 'Chayala',
    heightCm: 165,
    weightKg: 60,
    goal: 'wellbeing',
    dietStyle: 'balanced',
    activityLevel: 'moderate',
    sleepTargetHours: 8,
    waterTargetMl: 2500,
    sportSessionsPerWeek: 4,
    sportMinutesPerSession: 45,
    avoid: [],
  });

  const idx = ORDER.indexOf(step);
  const total = ORDER.length;

  const next = () => setStep(ORDER[Math.min(idx + 1, total - 1)]);
  const back = () => setStep(ORDER[Math.max(idx - 1, 0)]);

  const finish = async () => {
    const now = Date.now();
    const profile: Profile = {
      id: 'me',
      name: draft.name?.trim() || 'Chayala',
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
      goal: draft.goal ?? 'wellbeing',
      dietStyle: draft.dietStyle ?? 'balanced',
      activityLevel: draft.activityLevel ?? 'moderate',
      sleepTargetHours: draft.sleepTargetHours ?? 8,
      waterTargetMl: draft.waterTargetMl ?? 2500,
      sportSessionsPerWeek: draft.sportSessionsPerWeek ?? 4,
      sportMinutesPerSession: draft.sportMinutesPerSession ?? 45,
      avoid: draft.avoid ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await db.profile.put(profile);
    // Seed initial weight entry if user provided one
    if (draft.weightKg && draft.weightKg > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const existing = await db.weights.where('date').equals(today).first();
      if (!existing) {
        await db.weights.add({
          date: today,
          kg: draft.weightKg,
          createdAt: now,
        });
      }
    }
    onComplete();
    nav('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-rule">
        <div className="max-w-[820px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <span className="font-display font-bold text-lg tracking-[0.32em]">ALMANAC</span>
          <span className="label nums">
            {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
        <div className="max-w-[820px] mx-auto px-6 md:px-10">
          <div className="flex gap-1 pb-3">
            {ORDER.map((_, i) => (
              <div
                key={i}
                className={clsx('h-px flex-1 transition-colors', i <= idx ? 'bg-ink' : 'bg-rule')}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-[820px] mx-auto px-6 md:px-10 py-12">
          {step === 'welcome' && (
            <section className="reveal">
              <div className="label mb-4">prelude</div>
              <h1 className="font-display font-medium text-5xl md:text-6xl leading-[0.95]">
                Welcome to your <span className="font-display-italic text-clay-deep">almanac</span>.
              </h1>
              <Rule />
              <p className="font-serif text-lg text-ink-soft leading-relaxed max-w-xl">
                A few short questions to set the shape of your days — what you’re after,
                what you eat, how often you move. Everything stays on this device. You can
                change any of it later.
              </p>
              <div className="mt-10 flex gap-3">
                <button className="btn-ink" onClick={next}>begin</button>
              </div>
            </section>
          )}

          {step === 'you' && (
            <StepShell
              eyebrow="i. you"
              title="A little about you."
              onBack={back}
              onNext={next}
            >
              <div className="grid grid-cols-1 gap-y-6 mt-2">
                <div>
                  <div className="label mb-2">your name</div>
                  <input
                    className="field text-2xl font-display"
                    placeholder="how should I greet you?"
                    value={draft.name ?? ''}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                  <NumField
                    label="height"
                    unit="cm"
                    min={120}
                    max={220}
                    step={1}
                    value={draft.heightCm ?? 165}
                    onChange={(v) => setDraft({ ...draft, heightCm: v })}
                  />
                  <NumField
                    label="current weight"
                    unit="kg"
                    min={30}
                    max={200}
                    step={0.5}
                    value={draft.weightKg ?? 60}
                    onChange={(v) => setDraft({ ...draft, weightKg: v })}
                  />
                </div>
                <p className="text-xs text-ink-mute leading-relaxed border-t border-rule pt-3">
                  Used only on this device, for BMI and weight tracking. You can leave the weight
                  blank and add it later — your first entry will start the chart.
                </p>
              </div>
            </StepShell>
          )}

          {step === 'goal' && (
            <StepShell
              eyebrow="i. intention"
              title="What are you after?"
              onBack={back}
              onNext={next}
            >
              <RadioGrid<HealthGoal>
                value={draft.goal!}
                onChange={(g) => setDraft({ ...draft, goal: g })}
                options={[
                  { v: 'wellbeing', label: 'General wellbeing', sub: 'feel better day to day' },
                  { v: 'lose', label: 'Lose weight', sub: 'gentle deficit' },
                  { v: 'maintain', label: 'Maintain', sub: 'keep my current shape' },
                  { v: 'gain', label: 'Build muscle', sub: 'strength & size' },
                ]}
              />
            </StepShell>
          )}

          {step === 'diet' && (
            <StepShell
              eyebrow="ii. the table"
              title="How do you eat?"
              onBack={back}
              onNext={next}
            >
              <RadioGrid<DietStyle>
                value={draft.dietStyle!}
                onChange={(d) => setDraft({ ...draft, dietStyle: d })}
                options={[
                  { v: 'balanced', label: 'Balanced', sub: 'a bit of everything' },
                  { v: 'high-protein', label: 'High protein', sub: 'protein at every slot' },
                  { v: 'low-carb', label: 'Low carb', sub: 'fewer grains & sweets' },
                  { v: 'vegetarian', label: 'Vegetarian', sub: 'no meat, dairy & eggs ok' },
                  { v: 'vegan', label: 'Vegan', sub: 'plants only' },
                  { v: 'mediterranean', label: 'Mediterranean', sub: 'veg, olive oil, fish' },
                ]}
              />
            </StepShell>
          )}

          {step === 'activity' && (
            <StepShell
              eyebrow="iii. constitution"
              title="How active are you, normally?"
              onBack={back}
              onNext={next}
            >
              <RadioGrid<ActivityLevel>
                value={draft.activityLevel!}
                onChange={(a) => setDraft({ ...draft, activityLevel: a })}
                options={[
                  { v: 'sedentary', label: 'Sedentary', sub: 'mostly sitting' },
                  { v: 'light', label: 'Light', sub: 'walks, occasional motion' },
                  { v: 'moderate', label: 'Moderate', sub: 'a few sessions a week' },
                  { v: 'active', label: 'Active', sub: 'training most days' },
                  { v: 'very-active', label: 'Very active', sub: 'physical job or daily training' },
                ]}
              />
            </StepShell>
          )}

          {step === 'targets' && (
            <StepShell
              eyebrow="iv. targets"
              title="A few simple goals."
              onBack={back}
              onNext={next}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 mt-2">
                <NumField
                  label="sleep target"
                  unit="h / night"
                  min={5}
                  max={11}
                  step={0.5}
                  value={draft.sleepTargetHours!}
                  onChange={(v) => setDraft({ ...draft, sleepTargetHours: v })}
                />
                <NumField
                  label="water target"
                  unit="ml / day"
                  min={1000}
                  max={5000}
                  step={250}
                  value={draft.waterTargetMl!}
                  onChange={(v) => setDraft({ ...draft, waterTargetMl: v })}
                />
                <NumField
                  label="sport sessions"
                  unit="/ week"
                  min={0}
                  max={14}
                  step={1}
                  value={draft.sportSessionsPerWeek!}
                  onChange={(v) => setDraft({ ...draft, sportSessionsPerWeek: v })}
                />
                <NumField
                  label="session length"
                  unit="min"
                  min={10}
                  max={180}
                  step={5}
                  value={draft.sportMinutesPerSession!}
                  onChange={(v) => setDraft({ ...draft, sportMinutesPerSession: v })}
                />
              </div>
            </StepShell>
          )}

          {step === 'finish' && (
            <section className="reveal">
              <div className="label mb-4">vi. ready</div>
              <h1 className="font-display font-medium text-5xl md:text-6xl leading-[0.95]">
                {draft.name?.trim() ? `${draft.name.trim()}, your` : 'Your'}{' '}
                almanac is <span className="font-display-italic text-clay-deep">ready</span>.
              </h1>
              <Rule />
              <dl className="grid grid-cols-2 gap-x-10 gap-y-3 max-w-xl">
                <Summary k="name" v={draft.name?.trim() || '—'} />
                <Summary k="height · weight" v={`${draft.heightCm ?? '–'}cm · ${draft.weightKg ?? '–'}kg`} />
                <Summary k="goal" v={draft.goal!} />
                <Summary k="diet" v={draft.dietStyle!.replace('-', ' ')} />
                <Summary k="activity" v={draft.activityLevel!.replace('-', ' ')} />
                <Summary k="sleep" v={`${draft.sleepTargetHours}h / night`} />
                <Summary k="water" v={`${(draft.waterTargetMl! / 1000).toFixed(1)}L / day`} />
                <Summary k="sport" v={`${draft.sportSessionsPerWeek}× ${draft.sportMinutesPerSession}m`} />
              </dl>
              <div className="mt-10 flex gap-3">
                <button className="btn-ghost" onClick={back}>back</button>
                <button className="btn-ink" onClick={finish}>open the almanac →</button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  children,
  onBack,
  onNext,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="reveal">
      <div className="label mb-4">{eyebrow}</div>
      <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.0]">
        {title}
      </h1>
      <Rule />
      <div>{children}</div>
      <div className="mt-10 flex gap-3">
        <button className="btn-ghost" onClick={onBack}>back</button>
        <button className="btn-ink" onClick={onNext}>next →</button>
      </div>
    </section>
  );
}

function RadioGrid<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; label: string; sub: string }[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={clsx(
              'text-left px-4 py-4 border transition-all bg-paper-2/40',
              active ? 'border-ink bg-paper' : 'border-rule hover:border-ink-mute'
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display font-medium text-xl">{o.label}</span>
              {active && <span className="label text-clay-deep">selected</span>}
            </div>
            <div className="text-sm text-ink-soft mt-1">{o.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

function NumField({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="label">{label}</span>
        <span className="font-display text-3xl leading-none nums">
          {value}
          <span className="text-ink-mute text-sm ml-1">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="almanac"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Summary({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="label self-center">{k}</dt>
      <dd className="font-display text-lg text-ink">{v}</dd>
    </>
  );
}
