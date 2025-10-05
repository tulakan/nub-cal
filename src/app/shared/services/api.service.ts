import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { FoodService } from './food.service';
import { LocalStorageService } from './local-storage.service';
import { NavService } from './nav.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  nav = inject(NavService);
  auth = inject(AuthService);
  foodDb = inject(FoodService);
  localStorage = inject(LocalStorageService);
}
