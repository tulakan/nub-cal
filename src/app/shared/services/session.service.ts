import { Injectable, computed, inject, signal } from '@angular/core';
import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';

/** Maps Firebase auth error codes to short user-facing messages. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password';
    case 'auth/invalid-email':
      return 'That email address looks invalid';
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return 'You already have an account with this email. Enter your password to log in.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/missing-password':
      return 'Enter a password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'No connection. Check your network and try again.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'This sign-in method is not enabled yet.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private firebase = inject(FirebaseService);
  private auth = this.firebase.auth;

  /** undefined = not resolved yet, null = signed out. */
  readonly user = signal<User | null | undefined>(undefined);
  readonly uid = computed(() => this.user()?.uid ?? null);
  readonly isGuest = computed(() => !!this.user()?.isAnonymous);
  readonly email = computed(() => this.user()?.email ?? '');

  /** Resolves once Firebase has restored (or not) the session. */
  readonly ready: Promise<User | null>;

  constructor() {
    this.ready = new Promise(resolve => {
      onAuthStateChanged(this.auth, u => {
        this.user.set(u);
        resolve(u);
      });
    });
  }

  async signIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    this.user.set(cred.user);
  }

  async signUp(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    this.user.set(cred.user);
  }

  async guest() {
    const cred = await signInAnonymously(this.auth);
    this.user.set(cred.user);
  }

  /** Turns a guest account into an email account, keeping its data. */
  async upgradeGuest(email: string, password: string) {
    const u = this.auth.currentUser;
    if (!u) throw new Error('No user');
    const cred = EmailAuthProvider.credential(email, password);
    const res = await linkWithCredential(u, cred);
    this.user.set(res.user);
  }

  async resetPassword(email: string) {
    await sendPasswordResetEmail(this.auth, email);
  }

  async logout() {
    await signOut(this.auth);
    this.user.set(null);
  }
}
