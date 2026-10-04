import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { chooseFolder, resumeBackup, useBackupStatus } from '@/lib/autobackup';
import ExportBanner from './ExportBanner';

const PAUSED_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
const SNOOZE_KEY = 'almanac:backupInviteSnoozedAt';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

function snoozedRecently(): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(SNOOZE_KEY) ?? 0) < SNOOZE_MS;
  } catch {
    return false;
  }
}

/** One quiet line on Today, only when backup needs a click. Browsers without auto-backup keep the export reminder. */
export default function BackupNotice() {
  const s = useBackupStatus();
  const [snoozed, setSnoozed] = useState(snoozedRecently);
  const daysLogged = useLiveQuery(() => db.days.count(), []);
  const sleepLogged = useLiveQuery(() => db.sleep.count(), []);
  const enoughData = (daysLogged ?? 0) + (sleepLogged ?? 0) >= 3;

  if (!s.supported) return <ExportBanner />;

  if (!s.folder) {
    if (!enoughData || snoozed) return null;
    return (
      <Line text="Turn on automatic backup. Pick a folder once and the almanac saves itself there.">
        <button className="btn-ink !py-1 !px-3 !text-xs" onClick={() => void chooseFolder()}>
          choose folder
        </button>
        <button
          className="btn-ghost !py-1 !px-3 !text-xs"
          onClick={() => {
            try {
              localStorage.setItem(SNOOZE_KEY, String(Date.now()));
            } catch {
              /* ignore */
            }
            setSnoozed(true);
          }}
        >
          later
        </button>
      </Line>
    );
  }

  const stale = s.lastAt == null || Date.now() - s.lastAt > PAUSED_AFTER_MS;
  if (!stale) return null;
  if (s.error) {
    return (
      <Line text={`Backup paused. ${s.error}`}>
        <Link to="/settings" className="btn-ghost !py-1 !px-3 !text-xs">open settings</Link>
      </Line>
    );
  }
  if (s.permission !== 'granted') {
    return (
      <Line text="Backup paused. The browser needs your OK to keep saving to your folder.">
        <button className="btn-ink !py-1 !px-3 !text-xs" onClick={() => void resumeBackup()}>
          resume
        </button>
      </Line>
    );
  }
  return null;
}

function Line({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="reveal mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule pb-3 text-sm">
      <span className="h-2 w-2 rounded-full bg-amber" />
      <span className="text-ink-soft flex-1 min-w-[200px]">{text}</span>
      <span className="flex gap-2">{children}</span>
    </div>
  );
}
