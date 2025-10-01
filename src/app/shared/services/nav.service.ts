import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavService {
  private router = inject(Router);

  toLogin() {
    this.router.navigate(['/login']);
  }

  toMainPage() {
    this.router.navigate(['/']);
  }
}
