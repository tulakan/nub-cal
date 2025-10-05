import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  readonly IsLoggedInKey = 'isLoggedIn';
  readonly FoodListKey = 'foodList';
  constructor() {}

  setIsLoggedIn(value: boolean) {
    localStorage.setItem(this.IsLoggedInKey, value ? 'true' : 'false');
  }

  getIsLoggedIn(): boolean {
    return localStorage.getItem(this.IsLoggedInKey) === 'true';
  }

  setFoodList() {}

  getFoodList() {}

  clearFoodList() {}
}
