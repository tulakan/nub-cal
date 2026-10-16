import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import * as packageInfo from '../../../../package.json';
import { ConfirmService } from '../../shared/components/confirm-dialog.component';
import { GuideSheetComponent } from '../../shared/components/guide.component';
import { SheetComponent } from '../../shared/components/sheet.component';
import { SheetService } from '../../shared/components/sheet.service';
import { UndoService } from '../../shared/components/undo.service';
import { DemoService } from '../../shared/services/demo.service';
import {
  SessionService,
  authErrorMessage,
} from '../../shared/services/session.service';
import { UserDataService } from '../../shared/services/user-data.service';
import { FoodLogStore } from '../../stores/food-log.store';
import { ProfileStore } from '../../stores/profile.store';

/** Settings sheet: daily targets, help, account, data, about. */
@Component({
  selector: 'app-target-dialog',
  standalone: true,
  imports: [SheetComponent, MatIconModule],
  templateUrl: './target-dialog.component.html',
  styleUrls: ['./target-dialog.component.scss'],
})
export class TargetDialogComponent implements OnInit {
  private ref = inject(MatBottomSheetRef<TargetDialogComponent>);
  private undo = inject(UndoService);
  private confirm = inject(ConfirmService);
  private sheets = inject(SheetService);
  private router = inject(Router);
  private data = inject(UserDataService);
  session = inject(SessionService);
  log = inject(FoodLogStore);
  profile = inject(ProfileStore);
  private demo = inject(DemoService);

  kcal = signal(this.log.targets().kcal);
  protein = signal(this.log.targets().protein);
  carb = signal(this.log.targets().carb);
  fat = signal(this.log.targets().fat);

  version = (packageInfo as { version: string }).version;

  // guest upgrade
  newEmail = signal('');
  newPassword = signal('');
  upgrading = signal(false);
  upgradeError = signal('');

  legacy = signal(false);
  importing = signal(false);

  fromMacros = computed(() =>
    Math.round(this.protein() * 4 + this.carb() * 4 + this.fat() * 9)
  );
  mismatch = computed(
    () =>
      Math.abs(this.fromMacros() - this.kcal()) > 50 && this.fromMacros() > 0
  );
  split = computed(() => {
    const total = this.fromMacros() || 1;
    return {
      p: Math.round((this.protein() * 4 * 100) / total),
      c: Math.round((this.carb() * 4 * 100) / total),
      f: Math.round((this.fat() * 9 * 100) / total),
    };
  });
  valid = computed(
    () =>
      this.kcal() > 0 && this.protein() > 0 && this.carb() > 0 && this.fat() > 0
  );

  async ngOnInit() {
    if (!this.session.isGuest())
      this.legacy.set(await this.data.legacyAvailable());
  }

  set(field: 'kcal' | 'protein' | 'carb' | 'fat', raw: string) {
    const n = parseFloat(raw);
    this[field].set(isNaN(n) ? 0 : n);
  }

  useMacroKcal() {
    this.kcal.set(this.fromMacros());
  }

  recalc() {
    this.ref.dismiss();
    this.router.navigate(['/welcome'], { queryParams: { mode: 'targets' } });
  }

  guide() {
    this.ref.dismiss();
    this.sheets.open(GuideSheetComponent);
  }

  async save() {
    if (!this.valid()) return;
    await this.log.setTargets({
      kcal: this.kcal(),
      protein: this.protein(),
      carb: this.carb(),
      fat: this.fat(),
    });
    this.undo.notify('Targets saved');
    this.ref.dismiss();
  }

  async upgrade() {
    if (this.upgrading()) return;
    this.upgrading.set(true);
    this.upgradeError.set('');
    try {
      await this.session.upgradeGuest(
        this.newEmail().trim(),
        this.newPassword()
      );
      if (this.profile.profile()?.demo)
        await this.profile.update({ demo: false });
      this.undo.notify('Account created. Your data is saved.');
    } catch (e) {
      this.upgradeError.set(authErrorMessage(e));
    } finally {
      this.upgrading.set(false);
    }
  }

  async importLegacy() {
    const ok = await this.confirm.ask({
      title: 'Import previous data?',
      message:
        'Copies foods, menus and progress entries from the previous version into this account.',
      confirmLabel: 'Import',
    });
    if (!ok) return;
    this.importing.set(true);
    try {
      const r = await this.data.importLegacy();
      this.undo.notify(
        `Imported ${r.foods} foods, ${r.menus} menus, ${r.body + r.measurements} entries`
      );
    } catch (e) {
      console.error(e);
      this.undo.notify('Import failed. Please try again.');
    } finally {
      this.importing.set(false);
    }
  }

  async exitDemo() {
    this.ref.dismiss();
    await this.demo.exit();
  }

  async logout() {
    if (this.session.isGuest()) {
      const ok = await this.confirm.ask({
        title: 'Log out of guest account?',
        message:
          'Guest data cannot be recovered after logging out. Create an account first to keep it.',
        confirmLabel: 'Log out',
        destructive: true,
      });
      if (!ok) return;
    }
    this.ref.dismiss();
    await this.session.logout();
    this.router.navigate(['/login']);
  }
}
