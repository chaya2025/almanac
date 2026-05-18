import type {
  Profile,
  SleepEntry,
  MealEntry,
  WaterEntry,
  WorkoutEntry,
  FeedbackEntry,
  FeedbackSeverity,
  DietStyle,
  FoodGroup,
} from '@/types';

/* ---------- Sleep ---------- */

export function scoreSleep(hours: number | undefined, target: number): number {
  if (hours == null) return 0;
  const delta = Math.abs(hours - target);
  // 100 at target, drops 20pts per hour off
  return Math.max(0, Math.round(100 - delta * 20));
}

/**
 * Rolling sleep debt: sum of (hours - target) over the provided nights.
 * Positive = credit (more sleep than target); negative = debt.
 * Caller decides the window (e.g. last 7 days).
 */
export function sleepDebt(sleeps: SleepEntry[], targetHours: number): number {
  if (!sleeps.length) return 0;
  const sum = sleeps.reduce((s, x) => s + (x.hours - targetHours), 0);
  return Math.round(sum * 10) / 10;
}

export function sleepFeedback(hours: number | undefined, target: number): {
  severity: FeedbackSeverity;
  message: string;
  score: number;
} {
  const score = scoreSleep(hours, target);
  if (hours == null) {
    return { severity: 'warn', message: 'No sleep logged yet today.', score: 0 };
  }
  if (hours >= target - 0.5 && hours <= target + 1.5) {
    return { severity: 'good', message: `${fmtH(hours)} on ${fmtH(target)} target — well rested.`, score };
  }
  if (hours < target - 0.5) {
    const short = (target - hours).toFixed(1);
    return { severity: hours < target - 2 ? 'bad' : 'warn', message: `${fmtH(hours)} — ${short}h shy of target.`, score };
  }
  return { severity: 'warn', message: `${fmtH(hours)} — long sleep, watch for grogginess.`, score };
}

const fmtH = (h: number) => `${h.toFixed(h % 1 === 0 ? 0 : 1)}h`;

/* ---------- Water ---------- */

export function scoreWater(ml: number, targetMl: number): number {
  if (targetMl <= 0) return 0;
  const pct = ml / targetMl;
  if (pct >= 1) return 100;
  return Math.round(pct * 100);
}

export function waterFeedback(ml: number, targetMl: number) {
  const score = scoreWater(ml, targetMl);
  const liters = (ml / 1000).toFixed(1);
  const target = (targetMl / 1000).toFixed(1);
  if (score >= 100) return { severity: 'good' as const, message: `${liters}L — target met.`, score };
  if (score >= 70) return { severity: 'good' as const, message: `${liters}/${target}L — almost there.`, score };
  if (score >= 40) return { severity: 'warn' as const, message: `${liters}/${target}L — drink up.`, score };
  return { severity: 'bad' as const, message: `Only ${liters}/${target}L — far behind.`, score };
}

/* ---------- Meals ---------- */

// Per-diet-style target groups present in a "balanced" plate.
const DIET_TARGETS: Record<DietStyle, { wants: FoodGroup[]; limit: FoodGroup[] }> = {
  'balanced':       { wants: ['protein', 'veg', 'grain', 'fruit'], limit: ['sweet'] },
  'high-protein':   { wants: ['protein', 'veg'],                  limit: ['sweet', 'grain'] },
  'low-carb':       { wants: ['protein', 'veg', 'fat'],            limit: ['grain', 'sweet'] },
  'vegetarian':     { wants: ['protein', 'veg', 'grain', 'fruit'], limit: ['sweet'] },
  'vegan':          { wants: ['protein', 'veg', 'grain', 'fruit'], limit: ['sweet'] },
  'mediterranean':  { wants: ['veg', 'fat', 'protein', 'grain'],   limit: ['sweet'] },
};

// One meal slot: 0–100 based on how well its groups match the diet style.
export function scoreMealSlot(items: MealEntry['items'], style: DietStyle): number {
  if (!items.length) return 0;
  const groups = new Set(items.map((i) => i.group));
  const { wants, limit } = DIET_TARGETS[style];
  const hit = wants.filter((g) => groups.has(g)).length;
  const want = Math.min(2, wants.length); // a slot doesn't need EVERY group — 2 is plenty
  let score = (hit / want) * 100;
  // penalty for excessive sweets/limit items
  const limitHits = limit.filter((g) => groups.has(g)).length;
  score -= limitHits * 25;
  // small reward for a fruit or veg in any slot
  if (groups.has('veg') || groups.has('fruit')) score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreMealsForDay(meals: MealEntry[], style: DietStyle): number {
  if (!meals.length) return 0;
  const filled = meals.filter((m) => m.items.length > 0);
  if (!filled.length) return 0;
  const sum = filled.reduce((s, m) => s + scoreMealSlot(m.items, style), 0);
  // gently penalize missing main meals (breakfast, lunch, dinner)
  const main = ['breakfast', 'lunch', 'dinner'] as const;
  const skipped = main.filter((slot) => !filled.find((m) => m.slot === slot)).length;
  const base = sum / filled.length;
  return Math.max(0, Math.round(base - skipped * 8));
}

export function mealsFeedback(meals: MealEntry[], style: DietStyle) {
  const filled = meals.filter((m) => m.items.length > 0);
  const score = scoreMealsForDay(meals, style);

  if (!filled.length) {
    return { severity: 'warn' as const, message: 'No meals logged yet today.', score };
  }
  if (score >= 80) {
    return { severity: 'good' as const, message: 'Plate is well balanced today.', score };
  }
  if (score >= 55) {
    const missingVeg = !filled.some((m) => m.items.some((i) => i.group === 'veg'));
    return {
      severity: 'good' as const,
      message: missingVeg ? 'Solid day — a veg in any slot would round it out.' : 'Solid day — keep going.',
      score,
    };
  }
  if (score >= 30) {
    const allGroups = new Set(filled.flatMap((m) => m.items.map((i) => i.group)));
    if (!allGroups.has('protein')) {
      return { severity: 'warn' as const, message: 'Low protein today — add some to your next meal.', score };
    }
    if (!allGroups.has('veg') && !allGroups.has('fruit')) {
      return { severity: 'warn' as const, message: 'No fruit or veg yet — try a piece with a snack.', score };
    }
    return { severity: 'warn' as const, message: 'Plate is uneven — diversify groups next meal.', score };
  }
  return { severity: 'bad' as const, message: 'Off-plan today — main meals missing.', score };
}

/* ---------- Sport (weekly) ---------- */

export function scoreSportWeekly(
  workouts: WorkoutEntry[],
  profile: Pick<Profile, 'sportSessionsPerWeek' | 'sportMinutesPerSession'>
): number {
  const sessions = workouts.length;
  const totalMin = workouts.reduce((s, w) => s + w.durationMin, 0);
  const targetSessions = profile.sportSessionsPerWeek;
  const targetMin = targetSessions * profile.sportMinutesPerSession;
  if (targetMin <= 0) return 0;
  const sessionPct = Math.min(1, sessions / targetSessions);
  const minutePct = Math.min(1, totalMin / targetMin);
  // weight minutes a little more
  return Math.round((sessionPct * 0.4 + minutePct * 0.6) * 100);
}

export function sportFeedback(
  workouts: WorkoutEntry[],
  profile: Pick<Profile, 'sportSessionsPerWeek' | 'sportMinutesPerSession'>,
  weekProgressFraction: number // 0..1 — how far through the week we are
) {
  const score = scoreSportWeekly(workouts, profile);
  const sessions = workouts.length;
  const target = profile.sportSessionsPerWeek;

  if (score >= 100 || sessions >= target) {
    return { severity: 'good' as const, message: `${sessions}/${target} sessions — week's target met.`, score };
  }
  // are we keeping pace?
  const onPace = sessions >= Math.floor(weekProgressFraction * target);
  if (onPace) {
    return { severity: 'good' as const, message: `${sessions}/${target} sessions — on pace.`, score };
  }
  if (sessions === 0 && weekProgressFraction > 0.4) {
    return { severity: 'bad' as const, message: `No sessions yet this week — pick a day.`, score };
  }
  return { severity: 'warn' as const, message: `${sessions}/${target} sessions — behind pace this week.`, score };
}

/* ---------- Mood / energy vs sleep ---------- */

// Expected energy 1..5 from sleep hours
export function expectedEnergyFromSleep(hours: number | undefined): number | null {
  if (hours == null) return null;
  // simple curve: optimum around 8h
  const diff = Math.abs(hours - 8);
  return Math.max(1, Math.min(5, Math.round(5 - diff)));
}

export function moodFeedback(
  reportedMood: number | undefined,
  reportedEnergy: number | undefined,
  sleepHours: number | undefined
) {
  if (reportedMood == null && reportedEnergy == null) {
    return { severity: 'warn' as const, message: 'Mood not logged yet today.', score: 0 };
  }
  const expected = expectedEnergyFromSleep(sleepHours);
  const score = Math.round(((reportedMood ?? 3) + (reportedEnergy ?? 3)) * 10);
  if (expected == null) {
    return { severity: 'good' as const, message: `Mood ${reportedMood ?? '–'}/5 · Energy ${reportedEnergy ?? '–'}/5`, score };
  }
  const gap = (reportedEnergy ?? 3) - expected;
  if (gap <= -2) {
    return {
      severity: 'warn' as const,
      message: `Energy ${reportedEnergy}/5 is below what your sleep predicts (~${expected}/5).`,
      score,
    };
  }
  if (gap >= 2) {
    return {
      severity: 'good' as const,
      message: `Energy ${reportedEnergy}/5 — better than sleep alone would predict.`,
      score,
    };
  }
  return {
    severity: 'good' as const,
    message: `Mood ${reportedMood ?? '–'}/5 · Energy ${reportedEnergy ?? '–'}/5 — tracking with sleep.`,
    score,
  };
}

export type ScoredFeedback = {
  area: FeedbackEntry['area'];
  severity: FeedbackSeverity;
  message: string;
  score: number;
};
