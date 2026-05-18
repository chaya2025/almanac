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

/**
 * Build the export payload and trigger a download.
 * Returns the filename used. Updates lastExportAt on success.
 */
export async function exportToFile(name?: string): Promise<string> {
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
