import { Injectable } from '@angular/core';
import { AuthStore } from './auth.store';
import { FoodStore } from './food.store';

@Injectable({ providedIn: 'root' })
export class StoreService {
  auth = new AuthStore().toSignalStore();
  food = new FoodStore().toSignalStore();

  mapState<T>(fn: (store: StoreService) => T) {
    return fn(this);
  }

  reset() {}
}
