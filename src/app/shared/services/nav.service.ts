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

  navigateAfterLogin() {
    // Check if there's a return URL in query params
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');

    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.toMainPage();
    }
  }
}
