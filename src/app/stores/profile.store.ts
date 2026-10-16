import { Injectable, effect, inject, signal } from '@angular/core';
import { Unsubscribe, onSnapshot, setDoc } from 'firebase/firestore';
import { TargetMacros } from '../shared/interface/nutrition.interface';
import { SessionService } from '../shared/services/session.service';
import { UserDataService } from '../shared/services/user-data.service';

export type Gender = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface BodyProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}

export interface Profile {
  createdAt: number;
  onboarded: boolean;
  /** Demo account filled with sample data. */
  demo?: boolean;
  targets?: TargetMacros;
  body?: BodyProfile;
}

/** users/{uid} document: targets, onboarding state, body profile. */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private session = inject(SessionService);
  private data = inject(UserDataService);

  readonly profile = signal<Profile | null>(null);
  readonly loaded = signal(false);

  private unsub: Unsubscribe | null = null;
  private waiters: ((p: Profile | null) => void)[] = [];
  private loadedFor: string | null = null;

  constructor() {
    effect(
      () => {
        const uid = this.session.uid();
        this.unsub?.();
        this.unsub = null;
        this.profile.set(null);
        this.loaded.set(false);
        if (!uid) return;
        this.unsub = onSnapshot(
          this.data.profileRef(),
          snap => {
            if (!snap.exists()) {
              if (snap.metadata.fromCache) return; // wait for the server answer
              // merge + no `onboarded` field, so a concurrent onboarding save is never overwritten
              setDoc(
                this.data.profileRef(),
                { createdAt: Date.now() },
                { merge: true }
              ).catch(e => console.error(e));
              this.resolve(uid, { createdAt: Date.now(), onboarded: false });
              return;
            }
            const d = snap.data() as Partial<Profile>;
            this.resolve(uid, {
              createdAt: d.createdAt ?? Date.now(),
              ...d,
              onboarded: !!d.onboarded,
            });
          },
          err => {
            console.error('profile', err);
            this.resolve(uid, null);
          }
        );
      },
      { allowSignalWrites: true }
    );
  }

  private resolve(uid: string, p: Profile | null) {
    if (uid !== this.session.uid()) return;
    this.loadedFor = uid;
    this.profile.set(p);
    this.loaded.set(true);
    this.waiters.splice(0).forEach(w => w(p));
  }

  /** Resolves with the profile of the currently signed-in user (null if signed out). */
  async whenLoaded(): Promise<Profile | null> {
    return this.loadedProfile();
  }

  /** Stops listening (e.g. before deleting the account) so the profile isn't re-created. */
  detach() {
    this.unsub?.();
    this.unsub = null;
  }

  private async loadedProfile(): Promise<Profile | null> {
    await this.session.ready;
    if (!this.session.uid()) return null;
    if (this.loaded() && this.loadedFor === this.session.uid())
      return this.profile();
    return new Promise(resolve => this.waiters.push(resolve));
  }

  async update(patch: Partial<Profile>) {
    const uid = this.session.uid();
    const base =
      this.loadedFor === uid && this.profile()
        ? this.profile()!
        : { createdAt: Date.now(), onboarded: false };
    // Update memory first so guards see the change before the listener catches up.
    if (uid) this.resolve(uid, { ...base, ...patch });
    await setDoc(this.data.profileRef(), patch, { merge: true });
  }
}
