import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import Rule from '@/components/Rule';
import Card from '@/components/Card';
import { markExported, daysSinceLastExport } from '@/lib/backup';

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
      version: 2,
      exportedAt: new Date().toISOString(),
      profile: await db.profile.toArray(),
      days: await db.days.toArray(),
      sleep: await db.sleep.toArray(),
      meals: await db.meals.toArray(),
      water: await db.water.toArray(),
      workouts: await db.workouts.toArray(),
      weights: await db.weights.toArray(),
      foodLibrary: await db.foodLibrary.toArray(),
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
      await db.transaction('rw', [db.profile, db.days, db.sleep, db.meals, db.water, db.workouts, db.weights], async () => {
        if (Array.isArray(data.profile)) await db.profile.bulkPut(data.profile);
        if (Array.isArray(data.days)) await db.days.bulkPut(data.days);
        if (Array.isArray(data.sleep)) await db.sleep.bulkPut(data.sleep);
        if (Array.isArray(data.meals)) await db.meals.bulkPut(data.meals);
        if (Array.isArray(data.water)) await db.water.bulkPut(data.water);
        if (Array.isArray(data.workouts)) await db.workouts.bulkPut(data.workouts);
        if (Array.isArray(data.weights)) await db.weights.bulkPut(data.weights);
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
          <div className="mt-4">
            <a href="/onboarding" className="btn-ghost">re-take quiz</a>
          </div>
        </Card>

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
