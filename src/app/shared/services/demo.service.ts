import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProfileStore } from '../../stores/profile.store';
import { ConfirmService } from '../components/confirm-dialog.component';
import { UndoService } from '../components/undo.service';
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
  private snack = inject(MatSnackBar);

  readonly exiting = signal(false);

  /** Deletes the sample data and the temporary account, back to /login. */
  async exit() {
    if (this.exiting()) return;
    const ok = await this.confirm.ask({
      title: 'Exit demo?',
      message:
        'The sample data will be deleted. Create an account in Settings first if you want to keep it.',
      confirmLabel: 'Exit demo',
      destructive: true,
    });
    if (!ok) return;

    this.exiting.set(true);
    const progress = this.snack.open('Closing demo…', undefined, {
      duration: 0,
    });
    try {
      this.profile.detach();
      // Never keep the user waiting on cleanup; leftovers belong to a dead anonymous account.
      await Promise.race([
        this.data.deleteAccountAndData(),
        new Promise(resolve => setTimeout(resolve, CLEANUP_TIMEOUT_MS)),
      ]);
    } catch (e) {
      console.error('demo cleanup failed', e);
    }
    await this.session.logout().catch(() => {});
    progress.dismiss();
    await this.router.navigate(['/login']);
    this.exiting.set(false);
    this.undo.notify('Demo closed');
  }
}
