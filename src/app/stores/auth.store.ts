import { inject, Injectable } from '@angular/core';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ApiService } from '../shared/services/api.service';
import { FirebaseService } from '../shared/services/firebase.service';
import { SignalStore } from './signal-store';

export interface AuthState {
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  isLoggedIn: false,
};

@Injectable({
  providedIn: 'root',
})
export class AuthStore extends SignalStore<AuthState> {
  service = inject(ApiService);
  firebaseService = inject(FirebaseService);
  constructor() {
    super(initialState);
    this.init();
  }

  init() {
    this.setState({
      isLoggedIn: this.service.auth.isLoggedIn(),
    });
  }

  setLoginState(state: boolean) {
    this.setState({ isLoggedIn: state });
  }

  login(email: string, password: string) {
    signInWithEmailAndPassword(this.firebaseService.auth, email, password)
      .then(userCredential => {
        const user = userCredential.user;
        console.log('user >> ', user);
        this.setLoginState(true);
        this.service.localStorage.setIsLoggedIn(true);
        this.service.nav.toMainPage();
      })
      .catch(error => {
        console.error('error >> ', error);
        alert('Login failed: ' + error.message);
        this.service.localStorage.setIsLoggedIn(false);
        this.setLoginState(false);
      });
  }

  logout() {
    this.setLoginState(false);
    localStorage.clear();
    this.service.nav.toLogin();
  }
}
