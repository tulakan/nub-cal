import {
  BodyComposition,
  Circumference,
} from '../interface/body-composition.interface';
import { TargetMacros } from '../interface/nutrition.interface';

/** Sample profile for demo mode: someone ~3 months into a steady cut. */
export const DEMO_TARGETS: TargetMacros = {
  kcal: 1900,
  protein: 150,
  carb: 190,
  fat: 60,
};

export const DEMO_BODY = {
  goal: 'lose' as const,
  gender: 'male' as const,
  age: 32,
  heightCm: 175,
  weightKg: 86.4,
  activity: 'light' as const,
};

/** Today's log so far: breakfast menu + lunch + a snack. */
export const DEMO_LOG = [
  {
    menu: { id: 'starter-menu-protein-breakfast', name: 'Protein breakfast' },
    foodId: 'starter-egg',
    qty: 2,
  },
  {
    menu: { id: 'starter-menu-protein-breakfast', name: 'Protein breakfast' },
    foodId: 'starter-oats',
    qty: 40,
  },
  {
    menu: { id: 'starter-menu-protein-breakfast', name: 'Protein breakfast' },
    foodId: 'starter-banana',
    qty: 1,
  },
  { foodId: 'starter-kaprao', qty: 1 },
  { foodId: 'starter-greek-yogurt', qty: 150 },
];

/** Planned for later today. */
export const DEMO_PLAN_MENU_ID = 'starter-menu-chicken-bowl';

const WEEKS = 13;

/** Weekly entries ending today, trending the way a successful cut looks. */
export function demoBodyEntries(
  today = new Date()
): Omit<BodyComposition, 'id'>[] {
  const out: Omit<BodyComposition, 'id'>[] = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    const t = (WEEKS - 1 - i) / (WEEKS - 1); // 0 → 1
    const wobble = Math.sin(i * 1.7) * 0.35;
    const weight = round1(92.1 - 5.7 * t + wobble);
    const percentFat = round1(31.8 - 3.1 * t + wobble / 3);
    out.push({
      ts: daysAgo(today, i * 7),
      weight,
      percentFat,
      fatMass: round1((weight * percentFat) / 100),
      muscleMass: round1(33.6 + 0.6 * t + wobble / 4),
      visceralFat: Math.round(12 - 2 * t),
      note: i === WEEKS - 1 ? 'Start' : '',
    });
  }
  return out;
}

export function demoMeasurements(
  today = new Date()
): Omit<Circumference, 'id'>[] {
  const out: Omit<Circumference, 'id'>[] = [];
  for (let i = WEEKS - 1; i >= 0; i -= 2) {
    const t = (WEEKS - 1 - i) / (WEEKS - 1);
    const w = Math.sin(i) * 0.4;
    out.push({
      ts: daysAgo(today, i * 7),
      chest: round1(108 - 2 * t + w),
      waist: round1(101.5 - 6 * t + w),
      hip: round1(106 - 3.5 * t + w),
      leftArm: round1(36.5 - 0.3 * t),
      rightArm: round1(37 - 0.3 * t),
      leftThigh: round1(61 - 2.5 * t + w),
      rightThigh: round1(61.5 - 2.5 * t + w),
      leftCalf: round1(39 - 0.5 * t),
      rightCalf: round1(39.2 - 0.5 * t),
      note: '',
    });
  }
  return out;
}

function daysAgo(today: Date, n: number): Date {
  const d = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - n,
    8
  );
  return d;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
