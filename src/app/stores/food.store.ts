import { inject, Injectable } from '@angular/core';
import { ApiService } from '../shared/services/api.service';
import { SignalStore } from './signal-store';

export interface FoodState {
  foods: any[];
  foodOptions: any[];
}

const initialState: FoodState = {
  foods: [],
  foodOptions: [],
};

@Injectable({
  providedIn: 'root',
})
export class FoodStore extends SignalStore<FoodState> {
  api = inject(ApiService);
  constructor() {
    super(initialState);
  }

  async getFoods() {
    const res = await this.api.foodDb.getFoodList();
    console.log('res >> ', res);
    return res;
  }

  // async searchFood(query: string) {
  //   const res = await firstValueFrom(this.api.foodDb.searchFood(query));
  //   console.log('res >> ', res);
  // }
}
