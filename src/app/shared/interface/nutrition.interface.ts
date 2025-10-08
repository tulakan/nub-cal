import { Food } from './food.interface';

export interface TargetMacros {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export interface LoggedFood {
  food: Food;
  servingSize: number;
  calculatedNutrition: {
    kcal: number;
    protein: number;
    carb: number;
    fat: number;
  };
}
