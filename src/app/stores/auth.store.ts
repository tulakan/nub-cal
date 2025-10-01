import { Injectable } from '@angular/core';
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
  constructor() {
    super(initialState);
  }

  setLoginState(state: boolean) {
    this.setState({ isLoggedIn: state });
  }
}
