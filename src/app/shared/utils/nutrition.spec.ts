import { Food } from '../interface/food.interface';
import {
  ZERO_MACROS,
  calcNutrition,
  ingredientsNutrition,
  qtyStep,
  subtractMacros,
  sumNutrition,
} from './nutrition';

const rice: Food = {
  id: 'rice',
  name: 'Rice',
  servingSize: 100,
  unit: 'g',
  kcal: 130,
  protein: 2.7,
  carb: 28,
  fat: 0.3,
};

describe('nutrition', () => {
  it('scales a food by quantity and rounds to one decimal', () => {
    expect(calcNutrition(rice, 150)).toEqual({
      kcal: 195,
      protein: 4.1,
      carb: 42,
      fat: 0.5,
    });
  });

  it('returns zero for a missing food or a non-positive amount', () => {
    expect(calcNutrition(null, 100)).toEqual(ZERO_MACROS);
    expect(calcNutrition(rice, 0)).toEqual(ZERO_MACROS);
    expect(calcNutrition(rice, -5)).toEqual(ZERO_MACROS);
    expect(calcNutrition({ ...rice, servingSize: 0 }, 100)).toEqual(
      ZERO_MACROS
    );
  });

  it('sums and subtracts macros', () => {
    const a = { kcal: 100, protein: 10, carb: 5, fat: 2 };
    expect(sumNutrition([a, a]).kcal).toBe(200);
    expect(sumNutrition([])).toEqual(ZERO_MACROS);
    expect(subtractMacros(a, sumNutrition([a, a])).protein).toBe(-10);
  });

  it('counts deleted ingredients as zero', () => {
    const total = ingredientsNutrition(
      [
        { foodId: 'rice', quantity: 200 },
        { foodId: 'gone', quantity: 100 },
      ],
      new Map([['rice', rice]])
    );
    expect(total.kcal).toBe(260);
  });

  it('picks a +/- step that suits the unit', () => {
    expect(qtyStep('g')).toBe(10);
    expect(qtyStep('piece')).toBe(0.5);
    expect(qtyStep('kg')).toBe(1);
  });
});
