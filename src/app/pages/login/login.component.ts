import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { UndoService } from '../../shared/components/undo.service';
import {
  DEMO_BODY,
  DEMO_PLAN_MENU_ID,
  DEMO_TARGETS,
} from '../../shared/data/demo-data';
import { STARTER_MENUS } from '../../shared/data/starter-data';
import {
  SessionService,
  authErrorMessage,
} from '../../shared/services/session.service';
import { UserDataService } from '../../shared/services/user-data.service';
import { MenuPlanStore } from '../../stores/menu-plan.store';
import { ProfileStore } from '../../stores/profile.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private undo = inject(UndoService);
  private profile = inject(ProfileStore);
  private data = inject(UserDataService);
  private plan = inject(MenuPlanStore);
  session = inject(SessionService);

  email = '';
  password = '';
  show = signal(false);
  loading = signal<'' | 'login' | 'reset' | 'demo'>('');
  error = signal('');

  async submit() {
    if (this.loading()) return;
    if (!this.email.trim() || !this.password) {
      this.error.set('Enter your email and password.');
      return;
    }
    this.loading.set('login');
    this.error.set('');
    try {
      await this.session.signIn(this.email.trim(), this.password);
      const p = await this.profile.whenLoaded();
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      // Accounts from before onboarding existed finish setup once.
      await this.router.navigateByUrl(
        p && !p.onboarded ? '/welcome' : returnUrl || '/today'
      );
    } catch (e) {
      this.error.set(authErrorMessage(e));
    } finally {
      this.loading.set('');
    }
  }

  async forgot() {
    const email = this.email.trim();
    if (!email) {
      this.error.set('Enter your email first, then tap "Forgot password?"');
      return;
    }
    this.loading.set('reset');
    try {
      await this.session.resetPassword(email);
      this.undo.notify(`Reset link sent to ${email}`);
      this.error.set('');
    } catch (e) {
      this.error.set(authErrorMessage(e));
    } finally {
      this.loading.set('');
    }
  }

  /** Anonymous account pre-filled with sample data; no setup needed. */
  async tryDemo() {
    if (this.loading()) return;
    this.loading.set('demo');
    this.error.set('');
    try {
      await this.session.guest();
      await this.data.seedDemo();
      await this.profile.update({
        onboarded: true,
        demo: true,
        targets: DEMO_TARGETS,
        body: DEMO_BODY,
      });
      const dinner = STARTER_MENUS.find(m => m.id === DEMO_PLAN_MENU_ID);
      const uid = this.session.uid();
      if (dinner && uid) this.plan.seedPlan(uid, [dinner]);
      await this.router.navigate(['/today']);
    } catch (e) {
      this.error.set(authErrorMessage(e));
    } finally {
      this.loading.set('');
    }
  }

  getStarted() {
    this.router.navigate(['/welcome']);
  }

  continueSetup() {
    this.router.navigate(['/welcome']);
  }

  async logout() {
    await this.session.logout();
  }
}
