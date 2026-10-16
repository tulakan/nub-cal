import { Food } from './food.interface';

export interface TargetMacros {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export interface LoggedFood {
  /** Stable id for undo/edit. Legacy entries get one on load. */
  id?: string;
  /** Snapshot of the food at log time. */
  food: Food;
  servingSize: number;
  calculatedNutrition: {
    kcal: number;
    protein: number;
    carb: number;
    fat: number;
  };
  /** Set when logged from a menu. */
  group?: { id: string; menuId: string; name: string };
  loggedAt?: number;
}
