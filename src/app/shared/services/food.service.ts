import { Injectable, inject } from '@angular/core';
import {
  Unsubscribe,
  addDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { Food } from '../interface/food.interface';
import { UserDataService } from './user-data.service';

@Injectable({ providedIn: 'root' })
export class FoodService {
  private data = inject(UserDataService);

  listen(
    onData: (foods: Food[]) => void,
    onError?: (e: unknown) => void
  ): Unsubscribe {
    return onSnapshot(
      this.data.col('foods'),
      snap => onData(snap.docs.map(d => ({ ...(d.data() as Food), id: d.id }))),
      e => {
        console.error('foods listener', e);
        onError?.(e);
      }
    );
  }

  addFood(food: Omit<Food, 'id'>) {
    return addDoc(this.data.col('foods'), food);
  }

  updateFood(id: string, food: Partial<Food>) {
    const { id: _id, ...rest } = food;
    return setDoc(this.data.docRef('foods', id), rest, { merge: true });
  }

  deleteFood(id: string) {
    return deleteDoc(this.data.docRef('foods', id));
  }
}
