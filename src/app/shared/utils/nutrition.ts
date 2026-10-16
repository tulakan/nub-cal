import { Food } from '../interface/food.interface';

export interface Macros {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, carb: 0, fat: 0 };

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Nutrition for `qty` (in food.unit) of a food whose values are per food.servingSize. */
export function calcNutrition(
  food: Food | null | undefined,
  qty: number
): Macros {
  if (!food || !(qty > 0) || !(food.servingSize > 0)) return { ...ZERO_MACROS };
  const ratio = qty / food.servingSize;
  return {
    kcal: round1(food.kcal * ratio),
    protein: round1(food.protein * ratio),
    carb: round1(food.carb * ratio),
    fat: round1(food.fat * ratio),
  };
}

export function sumNutrition(items: Macros[]): Macros {
  return items.reduce(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      protein: a.protein + m.protein,
      carb: a.carb + m.carb,
      fat: a.fat + m.fat,
    }),
    { ...ZERO_MACROS }
  );
}

export function subtractMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal - b.kcal,
    protein: a.protein - b.protein,
    carb: a.carb - b.carb,
    fat: a.fat - b.fat,
  };
}

/** Totals for a list of {foodId, quantity}; unknown foods count as 0. */
export function ingredientsNutrition(
  ingredients: { foodId: string; quantity: number }[],
  foodsById: Map<string, Food>
): Macros {
  return sumNutrition(
    ingredients.map(i => calcNutrition(foodsById.get(i.foodId), i.quantity))
  );
}

/** Default step for +/- buttons by unit. */
export function qtyStep(unit: string): number {
  if (unit === 'g' || unit === 'ml') return 10;
  if (['piece', 'slice', 'serving', 'cup', 'tbsp', 'tsp'].includes(unit))
    return 0.5;
  return 1;
}
