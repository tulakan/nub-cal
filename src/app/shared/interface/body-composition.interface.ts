export interface BodyComposition {
  id?: string;
  ts: Date;
  weight: number;
  percentFat: number;
  fatMass: number;
  muscleMass: number;
  visceralFat: number;
  note?: string;

}

export interface Circumference {
  id?: string;
  ts: Date;
  chest: number;
  leftArm: number;
  rightArm: number;
  waist: number;
  hip: number;
  leftThigh: number;
  rightThigh: number;
  leftCalf: number;
  rightCalf: number;
  note?: string;

}
