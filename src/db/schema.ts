import Dexie, { type Table } from 'dexie';
import type {
  Profile,
  DayEntry,
  SleepEntry,
  MealEntry,
  WaterEntry,
  WorkoutEntry,
  FoodLibraryEntry,
  FeedbackEntry,
  WeightEntry,
} from '@/types';

export class AlmanacDB extends Dexie {
  profile!: Table<Profile, 'me'>;
  days!: Table<DayEntry, string>;
  sleep!: Table<SleepEntry, number>;
  meals!: Table<MealEntry, number>;
  water!: Table<WaterEntry, number>;
  workouts!: Table<WorkoutEntry, number>;
  foodLibrary!: Table<FoodLibraryEntry, number>;
  feedback!: Table<FeedbackEntry, number>;
  weights!: Table<WeightEntry, number>;

  constructor() {
    super('almanac');
    // v1: original schema
    this.version(1).stores({
      profile: 'id',
      days: 'date, updatedAt',
      sleep: '++id, date',
      meals: '++id, date, slot, [date+slot]',
      water: '++id, date, time',
      workouts: '++id, date',
      foodLibrary: '++id, &name, group, *tags',
      feedback: '++id, date, area, severity',
    });
    // v2: add weights table (height/weight live on profile)
    this.version(2).stores({
      profile: 'id',
      days: 'date, updatedAt',
      sleep: '++id, date',
      meals: '++id, date, slot, [date+slot]',
      water: '++id, date, time',
      workouts: '++id, date',
      foodLibrary: '++id, &name, group, *tags',
      feedback: '++id, date, area, severity',
      weights: '++id, &date, createdAt',
    });
  }
}

export const db = new AlmanacDB();
