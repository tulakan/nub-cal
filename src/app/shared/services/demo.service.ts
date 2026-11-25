import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileStore } from '../../stores/profile.store';
import { ConfirmService } from '../components/confirm-dialog.component';
import { UndoService } from '../components/undo.service';
import { clearLocalUserData } from '../utils/local-data';
import { SessionService } from './session.service';
import { UserDataService } from './user-data.service';

const CLEANUP_TIMEOUT_MS = 6000;

@Injectable({ providedIn: 'root' })
export class DemoService {
  private confirm = inject(ConfirmService);
  private data = inject(UserDataService);
  private session = inject(SessionService);
  private profile = inject(ProfileStore);
  private router = inject(Router);
  private undo = inject(UndoService);

  readonly exiting = signal(false);

  /** Deletes the sample data and the temporary account, back to /login. */
  async exit() {
    if (this.exiting()) return;
    const ok = await this.confirm.ask({
      title: 'Exit demo?',
      message:
        'The sample data will be deleted. Create an account in Settings first to keep the sample foods and menus.',
      confirmLabel: 'Exit demo',
      destructive: true,
    });
    if (!ok) return;

    this.exiting.set(true);
    this.profile.detach();
    // Cleanup runs in the background so leaving feels instant. Order matters:
    // it must read the account before release() clears it.
    this.session.holdAuth(this.cleanUp());
    this.session.release();
    await this.router.navigate(['/login']);
    this.exiting.set(false);
    this.undo.notify('Demo closed');
  }

  private async cleanUp() {
    // read before the first await: the app signs out while this runs
    const uid = this.session.uid();
    if (uid) clearLocalUserData(uid);
    try {
      // Never block the next sign-in for long; leftovers belong to a dead anonymous account.
      await Promise.race([
        this.data.deleteAccountAndData(),
        new Promise(resolve => setTimeout(resolve, CLEANUP_TIMEOUT_MS)),
      ]);
    } catch (e) {
      console.error('demo cleanup failed', e);
    }
    await this.session.logout().catch(() => {});
  }
}
