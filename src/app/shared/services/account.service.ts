import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileStore } from '../../stores/profile.store';
import { UndoService } from '../components/undo.service';
import { clearLocalUserData } from '../utils/local-data';
import { SessionService } from './session.service';
import { UserDataService } from './user-data.service';

const DELETE_TIMEOUT_MS = 20000;

/** Permanent deletion of a real (non-demo) account. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private data = inject(UserDataService);
  private session = inject(SessionService);
  private profile = inject(ProfileStore);
  private router = inject(Router);
  private undo = inject(UndoService);

  /**
   * Call after the user confirmed (and, for email accounts, re-entered the
   * password: Firebase refuses to delete a user whose sign-in is old, which
   * would otherwise leave an account whose data is already gone).
   */
  async deleteAccount() {
    const uid = this.session.uid();
    if (!uid) return;
    this.profile.detach();
    const job = this.deleteAndSignOut(uid);
    this.session.holdAuth(job);
    // signed out in the app at once, so no store writes data back meanwhile
    this.session.release();
    await this.router.navigate(['/login']);
    this.undo.notify('Deleting your account…');
    this.undo.notify(
      (await job)
        ? 'Account and data deleted'
        : "Couldn't delete everything. Log in and try again."
    );
  }

  private async deleteAndSignOut(uid: string): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    try {
      await Promise.race([
        this.data.deleteAccountAndData(),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('delete timed out')),
            DELETE_TIMEOUT_MS
          );
        }),
      ]);
      clearLocalUserData(uid);
      done = true;
    } catch (e) {
      console.error('account deletion failed', e);
    } finally {
      clearTimeout(timer);
    }
    await this.session.logout().catch(() => {});
    return done;
  }
}
