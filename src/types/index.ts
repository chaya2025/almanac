// Domain types for ALMANAC

export type FoodGroup =
  | 'protein'
  | 'veg'
  | 'fruit'
  | 'grain'
  | 'dairy'
  | 'fat'
  | 'sweet'
  | 'drink';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';

export const MEAL_SLOTS: MealSlot[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack1',
  'snack2',
];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack1: 'Snack i',
  snack2: 'Snack ii',
};

export type DietStyle =
  | 'balanced'
  | 'high-protein'
  | 'low-carb'
  | 'vegetarian'
  | 'vegan'
  | 'mediterranean';

export type HealthGoal = 'lose' | 'maintain' | 'gain' | 'wellbeing';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';

export interface Profile {
  id: 'me';
  name?: string;
  ageRange?: string;
  sex?: 'female' | 'male' | 'other' | 'na';
  heightCm?: number;
  weightKg?: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  dietStyle: DietStyle;
  avoid: string[]; // free-text tags
  sportSessionsPerWeek: number;
  sportMinutesPerSession: number;
  sleepTargetHours: number;
  waterTargetMl: number;
  createdAt: number;
  updatedAt: number;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  mood?: number; // 1..5
  energy?: number; // 1..5
  stress?: number; // 1..5
  journal?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SleepEntry {
  id?: number;
  date: string;
  hours: number;
  quality: number; // 1..5
  bedtime?: string;
  wakeTime?: string;
  updatedAt: number;
}

export interface MealItem {
  name: string;
  group: FoodGroup;
  qty?: number; // arbitrary units (servings)
}

export interface MealEntry {
  id?: number;
  date: string;
  slot: MealSlot;
  items: MealItem[];
  notes?: string;
  updatedAt: number;
}

export interface WaterEntry {
  id?: number;
  date: string;
  ml: number;
  time: number; // epoch ms
}

export interface WorkoutEntry {
  id?: number;
  date: string;
  sport: string;
  durationMin: number;
  intensity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface FoodLibraryEntry {
  id?: number;
  name: string;
  group: FoodGroup;
  tags: string[];
  kcalPer100?: number;
}

export type FeedbackSeverity = 'good' | 'warn' | 'bad';

export interface FeedbackEntry {
  id?: number;
  date: string;
  area: 'sleep' | 'meals' | 'water' | 'sport' | 'mood' | 'weight';
  severity: FeedbackSeverity;
  message: string;
  score: number; // 0..100
}

export interface WeightEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  kg: number;
  note?: string;
  createdAt: number;
}
