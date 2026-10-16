import { Activity, BodyProfile } from '../../stores/profile.store';
import { TargetMacros } from '../interface/nutrition.interface';

export const ACTIVITY: {
  value: Activity;
  label: string;
  hint: string;
  factor: number;
}[] = [
  {
    value: 'sedentary',
    label: 'Mostly sitting',
    hint: 'Desk job, little exercise',
    factor: 1.2,
  },
  {
    value: 'light',
    label: 'Lightly active',
    hint: 'Exercise 1–3 days a week',
    factor: 1.375,
  },
  {
    value: 'moderate',
    label: 'Moderately active',
    hint: 'Exercise 3–5 days a week',
    factor: 1.55,
  },
  {
    value: 'active',
    label: 'Very active',
    hint: 'Hard exercise 6–7 days a week',
    factor: 1.725,
  },
  {
    value: 'very',
    label: 'Athlete',
    hint: 'Physical job or training twice a day',
    factor: 1.9,
  },
];

export interface TargetBreakdown {
  bmr: number;
  tdee: number;
  adjustment: number;
  targets: TargetMacros;
}

/**
 * Mifflin-St Jeor BMR × activity = TDEE, then:
 * - lose: deficit of 500 kcal (max 25% of TDEE), floor 1200 (F) / 1500 (M)
 * - gain: +300 kcal
 * Protein per kg of a reference weight (actual weight, capped at BMI 25) so
 * targets stay realistic for larger bodies; fat 25% of kcal; carbs the rest.
 */
export function calcTargets(b: BodyProfile): TargetBreakdown {
  const bmr =
    10 * b.weightKg +
    6.25 * b.heightCm -
    5 * b.age +
    (b.gender === 'male' ? 5 : -161);
  const factor = ACTIVITY.find(a => a.value === b.activity)?.factor ?? 1.2;
  const tdee = bmr * factor;

  let adjustment = 0;
  if (b.goal === 'lose') adjustment = -Math.min(500, tdee * 0.25);
  if (b.goal === 'gain') adjustment = 300;
  const floor = b.gender === 'male' ? 1500 : 1200;
  let kcal = tdee + adjustment;
  if (b.goal === 'lose') kcal = Math.max(kcal, floor);
  kcal = Math.round(kcal / 10) * 10;

  const h = b.heightCm / 100;
  const refWeight = Math.min(b.weightKg, 25 * h * h);
  const perKg = b.goal === 'lose' ? 2.0 : b.goal === 'gain' ? 1.8 : 1.6;
  const protein = Math.round(refWeight * perKg);
  const fat = Math.round((kcal * 0.25) / 9);
  const carb = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    adjustment: Math.round(kcal - tdee),
    targets: { kcal, protein, carb, fat },
  };
}
