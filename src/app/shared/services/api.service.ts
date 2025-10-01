import { inject, Injectable } from '@angular/core';
import { NavService } from './nav.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  nav = inject(NavService);
}
