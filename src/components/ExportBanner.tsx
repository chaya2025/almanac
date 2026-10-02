import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import {
  REMIND_AFTER_DAYS,
  daysSinceLastExport,
  exportToFile,
  getLastExportAt,
} from '@/lib/backup';

export default function ExportBanner() {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const [snoozed, setSnoozed] = useState(false);
  const [days, setDays] = useState<number | null>(daysSinceLastExport());
  const [neverExported, setNeverExported] = useState(getLastExportAt() == null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // If the user has at least a few days of data and has never exported, prompt.
  // Or if it's been more than REMIND_AFTER_DAYS since last export.
  const daysLogged = useLiveQuery(() => db.days.count(), []);
  const sleepLogged = useLiveQuery(() => db.sleep.count(), []);
  const enoughData = (daysLogged ?? 0) + (sleepLogged ?? 0) >= 3;

  useEffect(() => {
    const t = setInterval(() => setDays(daysSinceLastExport()), 60 * 60 * 1000); // hourly
    return () => clearInterval(t);
  }, []);

  if (snoozed || !enoughData || done) return null;
  if (!neverExported && (days == null || days < REMIND_AFTER_DAYS)) return null;

  const message = neverExported
    ? "You haven't backed up your almanac yet."
    : `It's been ${days} days since your last backup.`;

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const filename = await exportToFile(profile?.name);
      setDone(filename);
      setNeverExported(false);
      setDays(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="reveal tone-coral mb-6 border-2 border-ink rounded-2xl bg-tone-soft shadow-pop px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-start gap-3 flex-1">
        <span className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-tone border-2 border-ink text-lg animate-wiggle" aria-hidden>💾</span>
        <div>
          <div className="font-display font-bold text-base text-ink">
            {message}{' '}
            <span className="text-ink-soft">A quick export keeps your chronicle safe.</span>
          </div>
          <div className="label mt-1">tip · drop the file in OneDrive, iCloud or Google Drive</div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:ml-auto">
        <button className="btn-ink" onClick={handleExport} disabled={busy}>
          {busy ? 'exporting…' : 'export now'}
        </button>
        <button className="btn-ghost" onClick={() => setSnoozed(true)}>
          later
        </button>
      </div>
    </div>
  );
}
