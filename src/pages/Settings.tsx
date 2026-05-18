import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import clsx from 'clsx';
import { db } from '@/db/schema';
import Rule from '@/components/Rule';
import Card from '@/components/Card';
import { markExported, daysSinceLastExport } from '@/lib/backup';
import type { FoodGroup, TimeFormat } from '@/types';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function Settings() {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string>('');
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches
  );
  const [lastExportDays, setLastExportDays] = useState<number | null>(daysSinceLastExport());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const exportAll = async () => {
    const dump = {
      version: 3,
      exportedAt: new Date().toISOString(),
      profile: await db.profile.toArray(),
      days: await db.days.toArray(),
      sleep: await db.sleep.toArray(),
      meals: await db.meals.toArray(),
      water: await db.water.toArray(),
      workouts: await db.workouts.toArray(),
      weights: await db.weights.toArray(),
      foodLibrary: await db.foodLibrary.toArray(),
      savedMeals: await db.savedMeals.toArray(),
    };
    const slug = (profile?.name ?? 'almanac').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-almanac-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    markExported();
    setLastExportDays(0);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // simple validation
      if (!data.version) throw new Error('Missing version');
      await db.transaction('rw', [db.profile, db.days, db.sleep, db.meals, db.water, db.workouts, db.weights, db.savedMeals], async () => {
        if (Array.isArray(data.profile)) await db.profile.bulkPut(data.profile);
        if (Array.isArray(data.days)) await db.days.bulkPut(data.days);
        if (Array.isArray(data.sleep)) await db.sleep.bulkPut(data.sleep);
        if (Array.isArray(data.meals)) await db.meals.bulkPut(data.meals);
        if (Array.isArray(data.water)) await db.water.bulkPut(data.water);
        if (Array.isArray(data.workouts)) await db.workouts.bulkPut(data.workouts);
        if (Array.isArray(data.weights)) await db.weights.bulkPut(data.weights);
        if (Array.isArray(data.savedMeals)) await db.savedMeals.bulkPut(data.savedMeals);
      });
      setImportMsg('Imported successfully.');
    } catch (e) {
      setImportMsg(`Import failed: ${(e as Error).message}`);
    }
  };

  const wipe = async () => {
    if (!confirm('Delete EVERYTHING in your almanac? This cannot be undone.')) return;
    await db.delete();
    location.reload();
  };

  return (
    <div className="max-w-[820px] mx-auto px-6 md:px-10 py-10">
      <div className="reveal">
        <div className="label">section iv.</div>
        <h1 className="font-display font-medium text-5xl md:text-6xl mt-1">
          Settings
        </h1>
        <Rule />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Card eyebrow="profile" title="Your shape">
          {profile ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <Row k="name" v={profile.name ?? '—'} />
              <Row k="height · weight" v={`${profile.heightCm ?? '–'}cm · ${profile.weightKg ?? '–'}kg`} />
              <Row k="goal" v={profile.goal} />
              <Row k="diet" v={profile.dietStyle} />
              <Row k="activity" v={profile.activityLevel} />
              <Row k="sleep target" v={`${profile.sleepTargetHours}h`} />
              <Row k="water target" v={`${(profile.waterTargetMl / 1000).toFixed(1)}L`} />
              <Row k="sport" v={`${profile.sportSessionsPerWeek}× ${profile.sportMinutesPerSession}m`} />
            </dl>
          ) : (
            <span className="label">no profile yet</span>
          )}
          <div className="mt-4 flex items-center gap-3">
            <a href="/onboarding" className="btn-ghost">re-take quiz</a>
            {profile && (
              <TimeFormatToggle
                value={(profile.timeFormat ?? '24h') as TimeFormat}
                onChange={async (fmt) => {
                  await db.profile.update('me', { timeFormat: fmt, updatedAt: Date.now() });
                }}
              />
            )}
          </div>
        </Card>

        <UserFoodsCard />
        <SavedMealsCard />

        <Card eyebrow="install" title="Live on your home screen">
          <p className="text-sm text-ink-soft mb-4 leading-relaxed">
            Almanac is a progressive web app — install it for an offline-capable, app-like
            window without browser chrome.
          </p>
          {installed ? (
            <span className="label text-moss-deep">✓ installed on this device</span>
          ) : installEvt ? (
            <button
              className="btn-ink"
              onClick={async () => {
                await installEvt.prompt();
                const { outcome } = await installEvt.userChoice;
                if (outcome === 'accepted') setInstalled(true);
                setInstallEvt(null);
              }}
            >
              install almanac
            </button>
          ) : (
            <span className="text-sm text-ink-mute italic">
              your browser will offer an install prompt when ready (open in Chrome / Edge,
              or use Safari’s Share → Add to Home Screen).
            </span>
          )}
        </Card>

        <Card eyebrow="data" title="Export & import">
          <div className="text-sm text-ink-soft mb-4 leading-relaxed">
            Your almanac lives only on this device. Back it up regularly — drop the JSON file
            into iCloud, OneDrive or a folder you trust.
          </div>
          <div className="label mb-3">
            last backup ·{' '}
            <span className="nums">
              {lastExportDays == null
                ? 'never'
                : lastExportDays === 0
                  ? 'today'
                  : `${lastExportDays} day${lastExportDays === 1 ? '' : 's'} ago`}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-ink" onClick={exportAll}>export json</button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>import json</button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
              }}
            />
          </div>
          {importMsg && <div className="mt-3 text-sm text-ink-soft">{importMsg}</div>}
        </Card>

        <Card eyebrow="danger" title="Erase the almanac">
          <p className="text-sm text-ink-soft mb-4">
            Removes every entry, profile and food added on this device.
          </p>
          <button
            className="px-3 py-1.5 text-xs uppercase tracking-[0.18em] border border-clay text-clay-deep hover:bg-clay hover:text-paper transition-colors"
            onClick={wipe}
          >
            wipe everything
          </button>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <>
      <dt className="label self-center">{k}</dt>
      <dd className="font-display text-base capitalize">{String(v).replace('-', ' ')}</dd>
    </>
  );
}

function TimeFormatToggle({ value, onChange }: { value: TimeFormat; onChange: (v: TimeFormat) => void }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="label">time</span>
      <div className="inline-flex border border-rule rounded-sm overflow-hidden">
        {(['24h', '12h'] as TimeFormat[]).map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={clsx(
              'px-2.5 py-1 text-[11px] uppercase tracking-[0.15em] transition-colors',
              value === v ? 'bg-ink text-paper' : 'text-ink-mute hover:bg-paper-2'
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

const ALL_GROUPS_FOR_SETTINGS: FoodGroup[] = ['protein', 'veg', 'fruit', 'grain', 'dairy', 'fat', 'sweet', 'drink'];

function UserFoodsCard() {
  const userFoods = useLiveQuery(
    () => db.foodLibrary.where('tags').equals('user-added').toArray(),
    []
  );

  if (!userFoods || userFoods.length === 0) {
    return (
      <Card eyebrow="library" title="Foods you've added">
        <p className="text-sm text-ink-soft italic">
          As you type new foods into your meals, they’ll be saved here so the next time you start
          typing the name, almanac will know them.
        </p>
      </Card>
    );
  }
  return (
    <Card eyebrow="library" title="Foods you've added">
      <ul className="divide-y divide-rule">
        {userFoods.map((f) => (
          <li key={f.id} className="py-2 flex items-center justify-between gap-3">
            <span className="font-display text-base">{f.name}</span>
            <div className="flex items-center gap-2">
              <select
                value={f.group}
                onChange={async (e) => {
                  if (f.id != null) {
                    await db.foodLibrary.update(f.id, { group: e.target.value as FoodGroup });
                  }
                }}
                className="text-[11px] uppercase tracking-[0.15em] border border-rule bg-paper px-2 py-1"
              >
                {ALL_GROUPS_FOR_SETTINGS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <button
                onClick={async () => {
                  if (f.id != null) await db.foodLibrary.delete(f.id);
                }}
                className="text-xs text-ink-mute hover:text-clay-deep"
                title="Remove from library"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SavedMealsCard() {
  const saved = useLiveQuery(() => db.savedMeals.orderBy('name').toArray(), []);
  if (!saved || saved.length === 0) {
    return (
      <Card eyebrow="cookbook" title="Saved meals">
        <p className="text-sm text-ink-soft italic">
          When you have a meal you eat often, tap “save as template” on Today after logging it.
          Saved meals show up here and as a one-tap option in any empty meal slot.
        </p>
      </Card>
    );
  }
  return (
    <Card eyebrow="cookbook" title="Saved meals">
      <ul className="divide-y divide-rule">
        {saved.map((m) => (
          <li key={m.id} className="py-2 flex items-baseline justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-display text-base">{m.name}</span>
              <span className="label">{m.items.map((it) => it.name).join(' · ')}</span>
            </div>
            <button
              onClick={async () => {
                if (m.id != null && confirm(`Delete saved meal "${m.name}"?`)) {
                  await db.savedMeals.delete(m.id);
                }
              }}
              className="text-xs text-ink-mute hover:text-clay-deep"
              title="Delete"
            >
              delete
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
