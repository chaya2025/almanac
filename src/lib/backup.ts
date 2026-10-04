import { z } from 'zod';
import { db } from '@/db/schema';

const KEY = 'almanac:lastExportAt';
export const REMIND_AFTER_DAYS = 14;

export function getLastExportAt(): number | null {
  try {
    const v = localStorage.getItem(KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function markExported(): void {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function daysSinceLastExport(): number | null {
  const last = getLastExportAt();
  if (last == null) return null;
  return Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
}

/** Everything in the almanac, in the backup file format. One read transaction so tables agree. */
export async function buildBackup() {
  const tables = [db.profile, db.days, db.sleep, db.meals, db.water, db.workouts, db.weights, db.foodLibrary, db.savedMeals];
  return db.transaction('r', tables, async () => ({
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
  }));
}

/**
 * Build the export payload and trigger a download.
 * Returns the filename used. Updates lastExportAt on success.
 */
export async function exportToFile(name?: string): Promise<string> {
  const dump = await buildBackup();
  const slug = (name ?? 'almanac').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'almanac';
  const filename = `${slug}-almanac-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  markExported();
  return filename;
}

/* ---------- Restore ---------- */

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dates must look like 2026-05-20');
const group = z.enum(['protein', 'veg', 'fruit', 'grain', 'dairy', 'fat', 'sweet', 'drink']);
const item = z.object({ name: z.string(), group, qty: z.number().optional() }).passthrough();

// Checks the shape of every row before anything is written. Unknown extra
// fields are kept (passthrough) so older or newer backups still load.
const BackupSchema = z.object({
  version: z.number(),
  exportedAt: z.string().optional(),
  profile: z.array(z.object({ id: z.literal('me') }).passthrough()).max(1).default([]),
  days: z.array(z.object({ date }).passthrough()).default([]),
  sleep: z.array(z.object({ date, hours: z.number(), quality: z.number() }).passthrough()).default([]),
  meals: z.array(z.object({ date, slot: z.string(), items: z.array(item) }).passthrough()).default([]),
  water: z.array(z.object({ date, ml: z.number() }).passthrough()).default([]),
  workouts: z.array(z.object({ date, sport: z.string(), durationMin: z.number() }).passthrough()).default([]),
  weights: z.array(z.object({ date, kg: z.number() }).passthrough()).default([]),
  foodLibrary: z.array(z.object({ name: z.string(), group }).passthrough()).default([]),
  savedMeals: z.array(z.object({ name: z.string(), items: z.array(item) }).passthrough()).default([]),
});

export type Backup = z.infer<typeof BackupSchema>;

/** Parse and validate a backup file. Throws a readable error if it isn't one. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  const result = BackupSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(`Not an Almanac backup (${first.path.join('.') || 'file'}: ${first.message}).`);
  }
  return result.data;
}

export function describeBackup(b: Backup): string {
  const days = new Set([...b.days, ...b.sleep, ...b.meals, ...b.water, ...b.workouts].map((r) => r.date));
  return `${days.size} days of entries, ${b.weights.length} weigh-ins, ${b.foodLibrary.length} foods`;
}

/**
 * Replace everything on this device with the backup, in one transaction:
 * either all of it lands or nothing changes. Replacing (not merging) matters
 * because entry ids are per-device; merging two devices would overwrite rows
 * that happen to share an id.
 */
export async function restoreBackup(b: Backup): Promise<void> {
  const tables = [db.profile, db.days, db.sleep, db.meals, db.water, db.workouts, db.weights, db.foodLibrary, db.savedMeals];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    await db.profile.bulkPut(b.profile as never[]);
    await db.days.bulkPut(b.days as never[]);
    await db.sleep.bulkPut(b.sleep as never[]);
    await db.meals.bulkPut(b.meals as never[]);
    await db.water.bulkPut(b.water as never[]);
    await db.workouts.bulkPut(b.workouts as never[]);
    await db.weights.bulkPut(b.weights as never[]);
    await db.foodLibrary.bulkPut(b.foodLibrary as never[]);
    await db.savedMeals.bulkPut(b.savedMeals as never[]);
  });
}
