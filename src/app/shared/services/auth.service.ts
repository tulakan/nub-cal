import { inject, Injectable } from '@angular/core';
import { onAuthStateChanged } from 'firebase/auth';
import { FirebaseService } from './firebase.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  localStorageService = inject(LocalStorageService);
  firebaseService = inject(FirebaseService);

  constructor() {
    // Monitor auth state changes
    onAuthStateChanged(this.firebaseService.auth, user => {
      if (user) {
        this.localStorageService.setIsLoggedIn(true);
      } else {
        this.localStorageService.setIsLoggedIn(false);
      }
    });
  }

  isLoggedIn() {
    return this.localStorageService.getIsLoggedIn();
  }

  getCurrentUser() {
    return this.firebaseService.auth.currentUser;
  }
}
