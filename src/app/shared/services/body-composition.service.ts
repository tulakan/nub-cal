import { Injectable, inject } from '@angular/core';
import {
  collection,
  getDocs,
  orderBy,
  query,
  setDoc,
  doc,
  where,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { BodyComposition, Circumference } from '../interface/body-composition.interface';

@Injectable({
  providedIn: 'root',
})
export class BodyCompositionService {
  private firebaseService = inject(FirebaseService);
  private bodyCompositionCollection = 'body_composition';
  private circumferenceCollection = 'circumference';
  private defaultUserId = 'default_user';

  constructor() {}

  async getBodyComposition(userId: string = this.defaultUserId): Promise<BodyComposition[]> {
    const q = query(
      collection(this.firebaseService.db, this.bodyCompositionCollection),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        ts: (data['ts'] as Timestamp).toDate()
      } as BodyComposition;
    });
    return data.sort((a, b) => a.ts.getTime() - b.ts.getTime());
  }

  async addBodyComposition(data: Omit<BodyComposition, 'id'>): Promise<void> {
    const docRef = collection(this.firebaseService.db, this.bodyCompositionCollection);
    await addDoc(docRef, {
      ...data,
      userId: data.userId || this.defaultUserId,
      ts: Timestamp.fromDate(data.ts)
    });
  }

  async getCircumference(userId: string = this.defaultUserId): Promise<Circumference[]> {
    const q = query(
      collection(this.firebaseService.db, this.circumferenceCollection),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        ts: (data['ts'] as Timestamp).toDate()
      } as Circumference;
    });
    return data.sort((a, b) => a.ts.getTime() - b.ts.getTime());
  }

  async addCircumference(data: Omit<Circumference, 'id'>): Promise<void> {
    const docRef = collection(this.firebaseService.db, this.circumferenceCollection);
    await addDoc(docRef, {
      ...data,
      userId: data.userId || this.defaultUserId,
      ts: Timestamp.fromDate(data.ts)
    });
  }

  async seedData(): Promise<void> {
    const bodyCompData = [
      { ts: new Date('2024-10-28'), weight: 122.1, percentFat: 39.6, fatMass: 48.4, muscleMass: 69.9, visceralFat: 19, note: 'VIVE Fitness มาที่ตึก EAST Park' },
      { ts: new Date('2025-01-06'), weight: 122.3, percentFat: 39.6, fatMass: 48.4, muscleMass: 70.1, visceralFat: 19, note: 'train ครั้งแรก' },
      { ts: new Date('2025-01-31'), weight: 123, percentFat: 38.2, fatMass: 47, muscleMass: 72.1, visceralFat: 20, note: 'เดือนแรกหลังโปรแกรมโค้ชชมพู่ MON:Body Pump / TUE:LEG / WED:Fat Killer / THU:Chest & Back / FRI:Shoulder & Arm' },
      { ts: new Date('2025-03-13'), weight: 122.1, percentFat: 37.8, fatMass: 46.2, muscleMass: 72, visceralFat: 19, note: 'ก่อนเริ่ม Train กับกานต์' },
      { ts: new Date('2025-03-30'), weight: 122.9, percentFat: 38.5, fatMass: 47.3, muscleMass: 71.7, visceralFat: 20, note: 'ชั่งสิ้นเดือน' },
      { ts: new Date('2025-04-22'), weight: 121.2, percentFat: 37, fatMass: 44.8, muscleMass: 72.5, visceralFat: 19, note: 'หลังจาก Train กับกานต์ 1 เดือน' },
      { ts: new Date('2025-05-20'), weight: 117.8, percentFat: 36.5, fatMass: 43, muscleMass: 71, visceralFat: 19, note: 'Train กับกานต์ 2 เดือน ครบ 30 ชั่วโมง' },
      { ts: new Date('2025-05-31'), weight: 116.4, percentFat: 37.5, fatMass: 43.6, muscleMass: 69.1, visceralFat: 18, note: 'ชั่งสิ้นเดือน' },
      { ts: new Date('2025-06-14'), weight: 116.8, percentFat: 37.1, fatMass: 43.3, muscleMass: 69.7, visceralFat: 19, note: 'ชั่งกลางเดือน' },
      { ts: new Date('2025-06-28'), weight: 117.6, percentFat: 37.7, fatMass: 44.3, muscleMass: 69.5, visceralFat: 19, note: 'ชั่งสิ้นเดือน' },
      { ts: new Date('2025-07-12'), weight: 117.9, percentFat: 37.4, fatMass: 44.1, muscleMass: 70, visceralFat: 19, note: 'ชั่งกลางเดือน' },
      { ts: new Date('2025-07-27'), weight: 118.6, percentFat: 37.5, fatMass: 44.5, muscleMass: 70.3, visceralFat: 19, note: 'ชั่งปลายเดือน' },
      { ts: new Date('2025-08-09'), weight: 117.9, percentFat: 37.4, fatMass: 44.1, muscleMass: 70, visceralFat: 19, note: 'ชั่งต้นเดือน' },
      { ts: new Date('2025-08-23'), weight: 118.4, percentFat: 37.6, fatMass: 44.5, muscleMass: 70.1, visceralFat: 19, note: 'ชั่งปลายเดือน' },
      { ts: new Date('2025-09-06'), weight: 119.5, percentFat: 38.4, fatMass: 45.9, muscleMass: 69.8, visceralFat: 19, note: 'ชั่งปลายเดือน' },
      { ts: new Date('2025-09-21'), weight: 118.6, percentFat: 37.8, fatMass: 44.8, muscleMass: 70, visceralFat: 19, note: 'ชั่งปลายเดือน' },
      { ts: new Date('2025-09-27'), weight: 119.2, percentFat: 39, fatMass: 46.5, muscleMass: 69, visceralFat: 19, note: 'ชั่งปลายเดือน' },
      { ts: new Date('2025-11-11'), weight: 117.3, percentFat: 36.3, fatMass: 42.6, muscleMass: 70.9, visceralFat: 19, note: 'VIVE อีกครั้งหลังจากจบเทรนกับพี่นัท Blue Box Gym' },
      { ts: new Date('2025-11-15'), weight: 116.5, percentFat: 38.1, fatMass: 44.4, muscleMass: 68.4, visceralFat: 19, note: '' },
      { ts: new Date('2025-11-29'), weight: 115.9, percentFat: 37.9, fatMass: 43.9, muscleMass: 68.3, visceralFat: 19, note: 'ชั่งปลายเดือน' },
      { ts: new Date('2025-12-13'), weight: 116.4, percentFat: 37.5, fatMass: 43.6, muscleMass: 69.1, visceralFat: 19, note: '' },
      { ts: new Date('2025-12-23'), weight: 116.6, percentFat: 36.1, fatMass: 42.1, muscleMass: 70.7, visceralFat: 19, note: 'วัดหลังออกกำลังกาย' },
      { ts: new Date('2026-01-03'), weight: 116.6, percentFat: 37.5, fatMass: 43.7, muscleMass: 69.2, visceralFat: 19, note: '' },
      { ts: new Date('2026-01-10'), weight: 115.8, percentFat: 37.2, fatMass: 43.1, muscleMass: 69, visceralFat: 18, note: '' },
      { ts: new Date('2026-01-24'), weight: 114.8, percentFat: 37.2, fatMass: 42.7, muscleMass: 68.4, visceralFat: 18, note: '' },
      { ts: new Date('2026-01-31'), weight: 114.8, percentFat: 36.3, fatMass: 41.7, muscleMass: 69.3, visceralFat: 18, note: '' },
      { ts: new Date('2026-02-07'), weight: 114.5, percentFat: 38.5, fatMass: 44.1, muscleMass: 66.8, visceralFat: 18, note: '' },
      { ts: new Date('2026-02-15'), weight: 115.6, percentFat: 36.6, fatMass: 42.3, muscleMass: 69.5, visceralFat: 18, note: '' },
      { ts: new Date('2026-02-21'), weight: 115.5, percentFat: 35.8, fatMass: 41.3, muscleMass: 70.4, visceralFat: 18, note: '' },
      { ts: new Date('2026-03-08'), weight: 114.5, percentFat: 34.8, fatMass: 39.8, muscleMass: 70.9, visceralFat: 18, note: '' }
    ];

    const circumData = [
      { ts: new Date('2025-01-11'), chest: 121.9, leftArm: 41, rightArm: 41, waist: 123.5, hip: 120.5, leftThigh: 75, rightThigh: 75, leftCalf: 48, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-01-25'), chest: 121, leftArm: 41, rightArm: 41, waist: 122, hip: 120.5, leftThigh: 76, rightThigh: 76, leftCalf: 49, rightCalf: 49, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-02-01'), chest: 121, leftArm: 43, rightArm: 43, waist: 119, hip: 122, leftThigh: 76, rightThigh: 75, leftCalf: 49.1, rightCalf: 49, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-02-28'), chest: 121.5, leftArm: 42, rightArm: 41, waist: 120.5, hip: 123, leftThigh: 75, rightThigh: 75, leftCalf: 49, rightCalf: 49, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-03-31'), chest: 121.8, leftArm: 41, rightArm: 39.5, waist: 120.4, hip: 124.5, leftThigh: 78, rightThigh: 76, leftCalf: 49, rightCalf: 49, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-05-03'), chest: 118.5, leftArm: 41, rightArm: 41, waist: 119.8, hip: 121, leftThigh: 76, rightThigh: 76, leftCalf: 48, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-06-07'), chest: 120.3, leftArm: 41, rightArm: 41, waist: 120.2, hip: 121, leftThigh: 76, rightThigh: 76, leftCalf: 48, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-07-20'), chest: 119.5, leftArm: 41.1, rightArm: 40.5, waist: 118, hip: 122, leftThigh: 74, rightThigh: 74, leftCalf: 48.5, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-08-23'), chest: 120, leftArm: 41, rightArm: 41, waist: 117, hip: 122, leftThigh: 70, rightThigh: 73, leftCalf: 49, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-09-06'), chest: 118, leftArm: 41, rightArm: 40, waist: 121, hip: 124, leftThigh: 76, rightThigh: 76, leftCalf: 48.5, rightCalf: 47, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-09-20'), chest: 118.2, leftArm: 41, rightArm: 40, waist: 121, hip: 126, leftThigh: 75, rightThigh: 75, leftCalf: 48, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-10-05'), chest: 119, leftArm: 40, rightArm: 40, waist: 120.5, hip: 123, leftThigh: 75, rightThigh: 75, leftCalf: 48.5, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-10-11'), chest: 118.5, leftArm: 41, rightArm: 41, waist: 119, hip: 121, leftThigh: 75, rightThigh: 75, leftCalf: 48, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-10-18'), chest: 117.5, leftArm: 41, rightArm: 41, waist: 119.5, hip: 123.5, leftThigh: 74.5, rightThigh: 75, leftCalf: 48, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-10-25'), chest: 118, leftArm: 39.5, rightArm: 39.5, waist: 117.5, hip: 121, leftThigh: 73.5, rightThigh: 73.5, leftCalf: 48, rightCalf: 48, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-11-08'), chest: 117.5, leftArm: 40.5, rightArm: 40.5, waist: 118.5, hip: 121, leftThigh: 73.5, rightThigh: 73.5, leftCalf: 47, rightCalf: 47, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-11-15'), chest: 118, leftArm: 41, rightArm: 41, waist: 118, hip: 120, leftThigh: 72, rightThigh: 72, leftCalf: 47.5, rightCalf: 47.5, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-11-23'), chest: 118, leftArm: 39.8, rightArm: 39.8, waist: 118, hip: 122, leftThigh: 75, rightThigh: 75, leftCalf: 47, rightCalf: 47, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2025-11-29'), chest: 119, leftArm: 40, rightArm: 40, waist: 119.5, hip: 121, leftThigh: 74, rightThigh: 74, leftCalf: 47, rightCalf: 47, note: 'เริ่มต้นวัดรอบร่างกาย' },
      { ts: new Date('2026-01-03'), chest: 119.5, leftArm: 40, rightArm: 40, waist: 120, hip: 120, leftThigh: 75.1, rightThigh: 75, leftCalf: 47.5, rightCalf: 47.5, note: '' },
      { ts: new Date('2026-01-10'), chest: 117.8, leftArm: 40.5, rightArm: 40.5, waist: 119, hip: 118, leftThigh: 74, rightThigh: 74, leftCalf: 47, rightCalf: 47, note: '' },
      { ts: new Date('2026-01-17'), chest: 117, leftArm: 41, rightArm: 41, waist: 118.5, hip: 119, leftThigh: 74, rightThigh: 74, leftCalf: 47, rightCalf: 47, note: '' },
      { ts: new Date('2026-01-24'), chest: 118, leftArm: 40, rightArm: 38, waist: 118, hip: 121, leftThigh: 75, rightThigh: 75, leftCalf: 47, rightCalf: 47, note: '' },
      { ts: new Date('2026-02-07'), chest: 117, leftArm: 40, rightArm: 40, waist: 117, hip: 120, leftThigh: 74, rightThigh: 75, leftCalf: 47, rightCalf: 47, note: '' },
      { ts: new Date('2026-02-14'), chest: 117.5, leftArm: 41, rightArm: 41, waist: 119.5, hip: 121, leftThigh: 76, rightThigh: 76, leftCalf: 48, rightCalf: 48, note: '' },
      { ts: new Date('2026-02-21'), chest: 118, leftArm: 41, rightArm: 41, waist: 122, hip: 121, leftThigh: 76, rightThigh: 76, leftCalf: 48, rightCalf: 48, note: '' },
      { ts: new Date('2026-03-08'), chest: 119.5, leftArm: 40, rightArm: 39, waist: 119, hip: 121, leftThigh: 75, rightThigh: 76, leftCalf: 48, rightCalf: 48, note: '' }
    ];

    // Check if data already exists for this user
    const bodyCompQuery = await getDocs(query(
      collection(this.firebaseService.db, this.bodyCompositionCollection),
      where('userId', '==', this.defaultUserId)
    ));
    
    if (bodyCompQuery.empty) {
      console.log('Seeding body composition data for default_user...');
      for (const item of bodyCompData) {
        await this.addBodyComposition(item);
      }
    }

    const circumQuery = await getDocs(query(
      collection(this.firebaseService.db, this.circumferenceCollection),
      where('userId', '==', this.defaultUserId)
    ));
    
    if (circumQuery.empty) {
      console.log('Seeding circumference data for default_user...');
      for (const item of circumData) {
        await this.addCircumference(item);
      }
    }
  }
}
