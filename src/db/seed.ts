import { db } from './schema';
import type { FoodLibraryEntry } from '@/types';

const SEED: Omit<FoodLibraryEntry, 'id'>[] = [
  // proteins
  { name: 'Eggs', group: 'protein', tags: ['breakfast', 'vegetarian'], kcalPer100: 155 },
  { name: 'Chicken breast', group: 'protein', tags: ['lean'], kcalPer100: 165 },
  { name: 'Salmon', group: 'protein', tags: ['omega-3'], kcalPer100: 208 },
  { name: 'Tuna', group: 'protein', tags: ['lean'], kcalPer100: 132 },
  { name: 'Tofu', group: 'protein', tags: ['vegan', 'vegetarian'], kcalPer100: 76 },
  { name: 'Lentils', group: 'protein', tags: ['vegan', 'fiber'], kcalPer100: 116 },
  { name: 'Chickpeas', group: 'protein', tags: ['vegan', 'fiber'], kcalPer100: 164 },
  { name: 'Greek yogurt', group: 'dairy', tags: ['protein', 'breakfast'], kcalPer100: 59 },
  { name: 'Cottage cheese', group: 'dairy', tags: ['protein'], kcalPer100: 98 },
  { name: 'Beans', group: 'protein', tags: ['vegan', 'fiber'], kcalPer100: 127 },

  // vegetables
  { name: 'Spinach', group: 'veg', tags: ['leafy', 'iron'], kcalPer100: 23 },
  { name: 'Broccoli', group: 'veg', tags: ['cruciferous'], kcalPer100: 34 },
  { name: 'Carrots', group: 'veg', tags: ['root'], kcalPer100: 41 },
  { name: 'Tomato', group: 'veg', tags: [], kcalPer100: 18 },
  { name: 'Cucumber', group: 'veg', tags: [], kcalPer100: 16 },
  { name: 'Bell pepper', group: 'veg', tags: [], kcalPer100: 31 },
  { name: 'Salad mix', group: 'veg', tags: ['leafy'], kcalPer100: 15 },
  { name: 'Sweet potato', group: 'veg', tags: ['starchy'], kcalPer100: 86 },

  // fruit
  { name: 'Apple', group: 'fruit', tags: ['snack'], kcalPer100: 52 },
  { name: 'Banana', group: 'fruit', tags: ['snack'], kcalPer100: 89 },
  { name: 'Blueberries', group: 'fruit', tags: ['berry'], kcalPer100: 57 },
  { name: 'Orange', group: 'fruit', tags: ['citrus'], kcalPer100: 47 },
  { name: 'Strawberries', group: 'fruit', tags: ['berry'], kcalPer100: 32 },
  { name: 'Avocado', group: 'fat', tags: ['fruit', 'healthy-fat'], kcalPer100: 160 },

  // grains
  { name: 'Oats', group: 'grain', tags: ['breakfast', 'fiber'], kcalPer100: 389 },
  { name: 'Rice', group: 'grain', tags: [], kcalPer100: 130 },
  { name: 'Whole-wheat bread', group: 'grain', tags: ['fiber'], kcalPer100: 247 },
  { name: 'Pasta', group: 'grain', tags: [], kcalPer100: 131 },
  { name: 'Quinoa', group: 'grain', tags: ['protein', 'fiber'], kcalPer100: 120 },

  // dairy
  { name: 'Milk', group: 'dairy', tags: ['drink'], kcalPer100: 42 },
  { name: 'Cheese', group: 'dairy', tags: ['fat'], kcalPer100: 402 },

  // fats / nuts
  { name: 'Almonds', group: 'fat', tags: ['nuts', 'snack'], kcalPer100: 579 },
  { name: 'Walnuts', group: 'fat', tags: ['nuts', 'omega-3'], kcalPer100: 654 },
  { name: 'Olive oil', group: 'fat', tags: ['healthy-fat'], kcalPer100: 884 },
  { name: 'Peanut butter', group: 'fat', tags: ['nuts'], kcalPer100: 588 },

  // sweets / treats
  { name: 'Dark chocolate', group: 'sweet', tags: ['treat'], kcalPer100: 546 },
  { name: 'Cookie', group: 'sweet', tags: ['treat'], kcalPer100: 480 },
  { name: 'Ice cream', group: 'sweet', tags: ['treat'], kcalPer100: 207 },
  { name: 'Cake', group: 'sweet', tags: ['treat'], kcalPer100: 350 },

  // drinks
  { name: 'Coffee', group: 'drink', tags: ['caffeine'], kcalPer100: 2 },
  { name: 'Tea', group: 'drink', tags: [], kcalPer100: 1 },
  { name: 'Orange juice', group: 'drink', tags: ['sweet'], kcalPer100: 45 },
  { name: 'Soda', group: 'drink', tags: ['sweet'], kcalPer100: 41 },
];

export async function seedFoodLibrary() {
  const count = await db.foodLibrary.count();
  if (count > 0) return;
  await db.foodLibrary.bulkAdd(SEED);
}
