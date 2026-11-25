import { BodyProfile } from '../../stores/profile.store';
import { calcTargets } from './targets';

const base: BodyProfile = {
  gender: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 80,
  activity: 'sedentary',
  goal: 'maintain',
};

describe('calcTargets', () => {
  it('uses Mifflin-St Jeor times the activity factor', () => {
    const r = calcTargets(base);
    // 10*80 + 6.25*175 - 5*30 + 5 = 1748.75
    expect(r.bmr).toBe(1749);
    expect(r.tdee).toBe(2099);
    expect(r.targets.kcal).toBe(2100);
  });

  it('takes 500 kcal off to lose and adds 300 to gain', () => {
    expect(calcTargets({ ...base, goal: 'lose' }).targets.kcal).toBe(1600);
    expect(calcTargets({ ...base, goal: 'gain' }).targets.kcal).toBe(2400);
  });

  it('never goes below the safety floor when losing', () => {
    const small: BodyProfile = {
      ...base,
      gender: 'female',
      age: 60,
      heightCm: 150,
      weightKg: 45,
      goal: 'lose',
    };
    expect(calcTargets(small).targets.kcal).toBe(1200);
  });

  it('caps the protein reference weight at BMI 25', () => {
    const heavy = calcTargets({ ...base, weightKg: 140 });
    // 25 * 1.75² = 76.6 kg, at 1.6 g/kg
    expect(heavy.targets.protein).toBe(123);
  });

  it('gives macros that add back up to the calorie target', () => {
    const { kcal, protein, carb, fat } = calcTargets(base).targets;
    expect(Math.abs(protein * 4 + carb * 4 + fat * 9 - kcal)).toBeLessThan(10);
  });
});
