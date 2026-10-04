/// <reference types="vite/client" />
import Dexie from 'dexie';
import { useSyncExternalStore } from 'react';
import { db } from '@/db/schema';
import { buildBackup, markExported } from '@/lib/backup';

/*
 * Automatic backup to a folder the user picks once (File System Access API,
 * Chrome and Edge on a computer). A few seconds after any change the whole
 * almanac is written to almanac-backup-YYYY-MM-DD.json in that folder. One
 * file per day, newest KEEP_DAYS kept, so a mistake never overwrites every copy.
 */

export const KEEP_DAYS = 14;
const DEBOUNCE_MS = 3000;
const LAST_KEY = 'almanac:lastAutoBackupAt';
const FILE_RE = /^almanac-backup-(\d{4}-\d{2}-\d{2})\.json$/;

// Not in TypeScript's DOM types yet
type Perm = 'granted' | 'prompt' | 'denied';
type DirHandle = FileSystemDirectoryHandle & {
  queryPermission(d: { mode: 'readwrite' }): Promise<Perm>;
  requestPermission(d: { mode: 'readwrite' }): Promise<Perm>;
  values(): AsyncIterable<FileSystemHandle>;
};
type PickerWindow = Window & {
  showDirectoryPicker(o?: { id?: string; mode?: 'readwrite'; startIn?: string }): Promise<DirHandle>;
};

// Its own small database, so the chosen folder survives a wipe or a restore
const meta = new Dexie('almanac-backup');
meta.version(1).stores({ kv: '' });

export type BackupStatus = {
  supported: boolean;
  folder: string | null; // folder name, null = not set up
  permission: Perm | null;
  lastAt: number | null;
  saving: boolean;
  error: string | null;
};

let handle: DirHandle | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let running: Promise<void> | null = null;
let again = false;
let started = false;

let status: BackupStatus = {
  supported: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
  folder: null,
  permission: null,
  lastAt: readLast(),
  saving: false,
  error: null,
};

const listeners = new Set<() => void>();
function set(patch: Partial<BackupStatus>) {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useBackupStatus(): BackupStatus {
  return useSyncExternalStore(subscribe, () => status);
}

function readLast(): number | null {
  try {
    const n = Number(localStorage.getItem(LAST_KEY));
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Load the saved folder and start listening for changes. Call once at startup. */
export async function initAutoBackup(): Promise<void> {
  if (!status.supported || started) return;
  started = true;
  // only changes to the almanac itself, not to the backup module's own database
  Dexie.on('storagemutated', (parts) => {
    if (Object.keys(parts).some((k) => k.startsWith('idb://almanac/'))) schedule();
  });
  window.addEventListener('pagehide', () => {
    if (timer) void backupNow();
  });
  try {
    const saved = (await meta.table('kv').get('dir')) as DirHandle | undefined;
    if (saved) await useFolder(saved);
  } catch (e) {
    set({ error: (e as Error).message || 'Could not load the backup folder.' });
  }
}

async function useFolder(h: DirHandle): Promise<void> {
  handle = h;
  set({ folder: h.name, permission: await h.queryPermission({ mode: 'readwrite' }), error: null });
  if (status.permission === 'granted') await backupNow();
}

/** Ask for a folder (needs a click). */
export async function chooseFolder(): Promise<void> {
  let h: DirHandle;
  try {
    h = await (window as unknown as PickerWindow).showDirectoryPicker({ id: 'almanac-backup', mode: 'readwrite', startIn: 'documents' });
  } catch (e) {
    if ((e as Error).name === 'AbortError') return; // closed the picker
    set({ error: (e as Error).message });
    return;
  }
  await meta.table('kv').put(h, 'dir');
  await useFolder(h);
}

/** Stop backing up and forget the folder. The files in it stay. */
export async function forgetFolder(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  handle = null;
  await meta.table('kv').delete('dir');
  set({ folder: null, permission: null, error: null });
}

/** After a browser restart Chrome may ask again; this needs a click. */
export async function resumeBackup(): Promise<void> {
  if (!handle) return;
  set({ permission: await handle.requestPermission({ mode: 'readwrite' }) });
  if (status.permission === 'granted') await backupNow();
}

function schedule() {
  if (!handle) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void backupNow(), DEBOUNCE_MS);
}

/** Write today's file now. One write at a time; a change during a write triggers one more. */
export async function backupNow(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (running) {
    again = true;
    return running;
  }
  running = write().finally(() => {
    running = null;
    if (again) {
      again = false;
      void backupNow();
    }
  });
  return running;
}

async function write(): Promise<void> {
  if (!handle) return;
  const dir = handle;
  try {
    const perm = await dir.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      set({ permission: perm });
      return;
    }
    // An empty almanac (just wiped) must never replace a real backup
    if ((await db.profile.count()) === 0) return;

    set({ saving: true });
    await writeFile(dir, `almanac-backup-${localDate()}.json`);
    // a file we can't delete (synced, locked) must not mark the backup as failed
    await prune(dir).catch(() => {});
    const now = Date.now();
    try {
      localStorage.setItem(LAST_KEY, String(now));
    } catch {
      /* ignore */
    }
    markExported();
    set({ lastAt: now, permission: 'granted', error: null });
  } catch (e) {
    const err = e as Error;
    if (err.name === 'NotAllowedError') set({ permission: 'prompt' });
    else if (err.name === 'NotFoundError') set({ error: 'The backup folder was moved or deleted. Choose it again.' });
    else set({ error: err.message || 'Backup failed.' });
  } finally {
    set({ saving: false });
  }
}

async function writeFile(dir: DirHandle, name: string): Promise<void> {
  const data = JSON.stringify(await buildBackup(), null, 2);
  const file = await dir.getFileHandle(name, { create: true });
  const w = await file.createWritable();
  await w.write(data);
  await w.close();
}

/**
 * Before a restore replaces everything, keep what's here now in its own file.
 * The name doesn't match the daily pattern, so pruning never deletes it.
 */
export async function saveBeforeRestore(): Promise<void> {
  if (!handle || (await db.profile.count()) === 0) return;
  const t = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = `${pad(t.getHours())}${pad(t.getMinutes())}${pad(t.getSeconds())}`;
  await writeFile(handle, `almanac-before-restore-${localDate()}-${time}.json`);
}

/** Delete our own daily files beyond the newest KEEP_DAYS. Never touches other files. */
async function prune(dir: DirHandle): Promise<void> {
  const ours: string[] = [];
  for await (const entry of dir.values()) {
    if (entry.kind === 'file' && FILE_RE.test(entry.name)) ours.push(entry.name);
  }
  ours.sort().reverse(); // ISO dates sort as text
  for (const name of ours.slice(KEEP_DAYS)) await dir.removeEntry(name);
}

function localDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Lets the browser test hand in a folder without the native picker. Dev server only.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __almanacBackup: unknown }).__almanacBackup = {
    useFolder: async (h: DirHandle) => {
      await meta.table('kv').put(h, 'dir');
      await useFolder(h);
    },
    status: () => status,
  };
}
