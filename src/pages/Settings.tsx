import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import clsx from 'clsx';
import { db } from '@/db/schema';
import Rule from '@/components/Rule';
import Card from '@/components/Card';
import { daysSinceLastExport, exportToFile, parseBackup, describeBackup, restoreBackup } from '@/lib/backup';
import { isStoragePersistent, requestPersistentStorage } from '@/lib/storage';
import type { FoodGroup, TimeFormat } from '@/types';
import { GROUP_LABEL } from '@/types';
import { DayPicker } from '@/pages/Onboarding';
import { weighInDay } from '@/lib/weight';
import { formatDistanceToNowStrict } from 'date-fns';
import { backupNow, chooseFolder, forgetFolder, KEEP_DAYS, resumeBackup, saveBeforeRestore, useBackupStatus } from '@/lib/autobackup';

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
    await exportToFile(profile?.name);
    setLastExportDays(0);
  };

  const backupStatus = useBackupStatus();

  const handleImport = async (file: File) => {
    try {
      const backup = parseBackup(await file.text());
      const autoOn = backupStatus.folder != null && backupStatus.permission === 'granted' && !backupStatus.error;
      const ok = confirm(
        `Restore this backup?\n\nIt has ${describeBackup(backup)}.\n\n` +
          'Everything currently on this device will be replaced by it. ' +
          (autoOn
            ? 'A copy of what is here now is saved to your backup folder first.'
            : 'Download a copy first if you want to keep what is here.')
      );
      if (!ok) return;
      if (autoOn) await saveBeforeRestore();
      await restoreBackup(backup);
      setImportMsg(`Restored: ${describeBackup(backup)}.`);
    } catch (e) {
      setImportMsg(`Import failed: ${(e as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const wipe = async () => {
    if (!confirm('Delete EVERYTHING in your almanac? This cannot be undone.')) return;
    // stop auto-backup first so a fresh almanac never overwrites the old backups
    await forgetFolder();
    await db.delete();
    location.reload();
  };

  return (
    <div className="max-w-[820px] mx-auto px-6 md:px-10 py-10">
      <div className="reveal">
        <div className="label">section iv.</div>
        <h1 className="font-display font-normal text-5xl md:text-6xl mt-1 tracking-[-0.02em]">
          Settings
        </h1>
        <Rule />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Card eyebrow="profile" title="Your shape">
          {profile ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <Row k="name" v={profile.name ?? '—'} />
              <Row
                k="height · weight"
                v={[profile.heightCm && `${profile.heightCm} cm`, profile.weightKg && `${profile.weightKg} kg`].filter(Boolean).join(' · ') || 'not set'}
              />
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
          {profile && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="label">weigh-in day</span>
              <DayPicker
                value={weighInDay(profile)}
                onChange={async (d) => {
                  await db.profile.update('me', { weighInDay: d, updatedAt: Date.now() });
                }}
              />
            </div>
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

        <Card eyebrow="data" title="Backup">
          <AutoBackupStatus
            fallback={
              <>
                <div className="text-sm text-ink-soft mb-4 leading-relaxed">
                  Your almanac lives only in this browser, on this device. Nothing is sent anywhere.
                  Automatic backup needs Chrome or Edge on a computer; here, download a copy now and
                  then and keep it in OneDrive, iCloud or a folder you trust.
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
                <button className="btn-ink" onClick={exportAll}>download a copy</button>
              </>
            }
          />
          <div className="mt-6 border-t border-rule pt-4">
            <StorageStatus />
            <div className="flex flex-wrap items-center gap-3">
              <span className="label">restore</span>
              <button className="btn-ghost !py-1 !px-3 !text-xs" onClick={() => fileRef.current?.click()}>
                from a backup file
              </button>
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
          </div>
        </Card>

        <Card eyebrow="danger" title="Erase the almanac">
          <p className="text-sm text-ink-soft mb-4">
            Removes every entry, profile and food added on this device. Files already in your
            backup folder stay there.
          </p>
          <button
            className="btn-ghost !text-clay-deep !border-clay-deep/40 hover:!bg-clay-deep hover:!text-white"
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
                  <option key={g} value={g}>{GROUP_LABEL[g]}</option>
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

function StorageStatus() {
  const [persistent, setPersistent] = useState<boolean | null>(null);
  useEffect(() => {
    isStoragePersistent().then(setPersistent);
  }, []);
  if (persistent == null) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
      <span className={clsx('h-2 w-2 rounded-full', persistent ? 'bg-moss' : 'bg-amber')} />
      <span className="text-ink-soft">
        {persistent
          ? 'Protected storage: the browser won’t clear your entries to free up space.'
          : 'Standard storage: the browser may clear entries if the device runs low on space.'}
      </span>
      {!persistent && (
        <button className="btn-ghost !py-1 !px-2.5 !text-xs" onClick={async () => setPersistent(!!(await requestPersistentStorage()))}>
          protect
        </button>
      )}
    </div>
  );
}

function AutoBackupStatus({ fallback }: { fallback: React.ReactNode }) {
  const s = useBackupStatus();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000); // keep "x min ago" fresh
    return () => clearInterval(t);
  }, []);

  if (!s.supported) return <>{fallback}</>;

  if (!s.folder) {
    return (
      <>
        <p className="text-sm text-ink-soft mb-4 leading-relaxed">
          Pick a folder once and the almanac saves itself there a few seconds after every change.
          Choose a folder inside OneDrive and your backup is online too. One file per day, the
          newest {KEEP_DAYS} are kept.
        </p>
        <button className="btn-ink" onClick={() => void chooseFolder()}>choose backup folder</button>
        {s.error && <div className="mt-3 text-sm text-clay-deep">{s.error}</div>}
      </>
    );
  }

  const paused = s.permission !== 'granted' || !!s.error;
  const ago = s.lastAt
    ? `${paused ? 'last backup' : 'backed up'} ${formatDistanceToNowStrict(s.lastAt, { addSuffix: true })}`
    : 'not backed up yet';

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className={clsx('h-2 w-2 rounded-full', paused ? 'bg-amber' : 'bg-moss')} />
        <span className="text-ink">
          {paused ? 'Auto-backup paused' : 'Auto-backup on'} · saving to{' '}
          <span className="font-display">“{s.folder}”</span>
        </span>
        <span className="label nums" data-testid="backup-ago">{s.saving ? 'saving…' : ago}</span>
      </div>
      {s.error ? (
        <div className="mt-2 text-sm text-clay-deep">{s.error}</div>
      ) : (
        paused && (
          <div className="mt-2 text-sm text-ink-soft">The browser needs your OK to keep saving to this folder.</div>
        )
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {s.permission !== 'granted' && !s.error ? (
          <button className="btn-ink" onClick={() => void resumeBackup()}>resume</button>
        ) : (
          <button className="btn-ink" onClick={() => void backupNow()} disabled={s.saving || !!s.error}>back up now</button>
        )}
        <button className="btn-ghost" onClick={() => void chooseFolder()}>change folder</button>
      </div>
      <p className="mt-3 text-xs text-ink-mute">One file per day, the newest {KEEP_DAYS} are kept.</p>
    </>
  );
}
