import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { GuideComponent } from '../../shared/components/guide.component';
import { MacroChipsComponent } from '../../shared/components/macro-chips.component';
import { SegmentedComponent } from '../../shared/components/primitives';
import { UndoService } from '../../shared/components/undo.service';
import { KcalPipe } from '../../shared/pipes/format.pipes';
import {
  SessionService,
  authErrorMessage,
} from '../../shared/services/session.service';
import { UserDataService } from '../../shared/services/user-data.service';
import { ACTIVITY, calcTargets } from '../../shared/utils/targets';
import { DEFAULT_TARGETS } from '../../stores/food-log.store';
import {
  Activity,
  BodyProfile,
  Gender,
  Goal,
  ProfileStore,
} from '../../stores/profile.store';

type Step = 'hello' | 'body' | 'targets' | 'guide' | 'account' | 'start';

/**
 * - new:     signed out → hello, body, targets, guide, account (sign up or guest)
 * - setup:   signed in, profile not set up yet → body, targets, guide, start
 * - targets: from Settings → body, targets
 */
type Mode = 'new' | 'setup' | 'targets';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    MatIconModule,
    SegmentedComponent,
    GuideComponent,
    MacroChipsComponent,
    KcalPipe,
  ],
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private profile = inject(ProfileStore);
  private data = inject(UserDataService);
  private undo = inject(UndoService);
  session = inject(SessionService);

  activities = ACTIVITY;
  goals = [
    { value: 'lose', label: 'Lose fat' },
    { value: 'maintain', label: 'Maintain' },
    { value: 'gain', label: 'Build muscle' },
  ];
  genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  mode: Mode =
    this.route.snapshot.queryParamMap.get('mode') === 'targets'
      ? 'targets'
      : this.session.user()
        ? 'setup'
        : 'new';
  steps: Step[] =
    this.mode === 'targets'
      ? ['body', 'targets']
      : this.mode === 'setup'
        ? ['body', 'targets', 'guide', 'start']
        : ['hello', 'body', 'targets', 'guide', 'account'];
  index = signal(0);
  step = computed(() => this.steps[this.index()]);

  goal = signal<Goal>('lose');
  gender = signal<Gender>('male');
  age = signal<number | null>(null);
  height = signal<number | null>(null);
  weight = signal<number | null>(null);
  activity = signal<Activity>('light');
  skipped = signal(false);

  // account step (new users)
  email = signal('');
  password = signal('');
  showPw = signal(false);
  accountError = signal('');
  emailTaken = signal(false);

  legacy = signal(false);
  useStarter = signal(true);
  useLegacy = signal(false);
  busy = signal<'' | 'signup' | 'guest' | 'finish'>('');

  bodyValid = computed(() => {
    const a = this.age(),
      h = this.height(),
      w = this.weight();
    return (
      !!a &&
      a >= 13 &&
      a <= 100 &&
      !!h &&
      h >= 120 &&
      h <= 230 &&
      !!w &&
      w >= 30 &&
      w <= 300
    );
  });

  body = computed<BodyProfile | null>(() =>
    this.bodyValid()
      ? {
          goal: this.goal(),
          gender: this.gender(),
          age: this.age()!,
          heightCm: this.height()!,
          weightKg: this.weight()!,
          activity: this.activity(),
        }
      : null
  );

  result = computed(() => {
    const b = this.body();
    return b && !this.skipped() ? calcTargets(b) : null;
  });
  targets = computed(() => this.result()?.targets ?? DEFAULT_TARGETS);
  /** ~7700 kcal per kg of body fat. */
  weeklyKg = computed(() => {
    const adj = this.result()?.adjustment ?? 0;
    return (Math.round(((-adj * 7) / 7700) * 10) / 10).toFixed(1);
  });

  async ngOnInit() {
    if (this.mode === 'new') return;
    const b = (await this.profile.whenLoaded())?.body;
    if (b) {
      this.goal.set(b.goal);
      this.gender.set(b.gender);
      this.age.set(b.age);
      this.height.set(b.heightCm);
      this.weight.set(b.weightKg);
      this.activity.set(b.activity);
    }
    if (this.mode === 'setup' && !this.session.isGuest()) {
      const has = await this.data.legacyAvailable();
      this.legacy.set(has);
      if (has) {
        this.useLegacy.set(true);
        this.useStarter.set(false);
      }
    }
  }

  num(s: { set(v: number | null): void }, raw: string) {
    const n = parseFloat(raw.replace(',', '.'));
    s.set(isNaN(n) ? null : n);
  }

  next() {
    if (this.index() < this.steps.length - 1) this.index.update(i => i + 1);
    else if (this.mode !== 'new') this.finish();
  }

  back() {
    if (this.index() > 0) this.index.update(i => i - 1);
    else if (this.mode === 'targets') this.router.navigate(['/today']);
    else this.router.navigate(['/login']);
  }

  skipBody() {
    this.skipped.set(true);
    this.index.set(this.steps.indexOf('targets'));
  }

  continueBody() {
    this.skipped.set(false);
    this.next();
  }

  async logout() {
    await this.session.logout();
    await this.router.navigate(['/login']);
  }

  /** New user: create the account, then save the setup into it. */
  async signUp() {
    if (this.busy()) return;
    this.busy.set('signup');
    this.accountError.set('');
    this.emailTaken.set(false);
    try {
      await this.session.signUp(this.email().trim(), this.password());
    } catch (e) {
      this.accountError.set(authErrorMessage(e));
      this.emailTaken.set(
        (e as { code?: string })?.code === 'auth/email-already-in-use'
      );
      this.busy.set('');
      return;
    }
    await this.finish();
  }

  async continueAsGuest() {
    if (this.busy()) return;
    this.busy.set('guest');
    this.accountError.set('');
    try {
      await this.session.guest();
    } catch (e) {
      this.accountError.set(authErrorMessage(e));
      this.busy.set('');
      return;
    }
    await this.finish();
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

  async finish() {
    if (this.busy() === 'finish') return;
    this.busy.set('finish');
    try {
      const patch = {
        targets: this.targets(),
        ...(this.body() && !this.skipped() ? { body: this.body()! } : {}),
      };
      if (this.mode === 'targets') {
        await this.profile.update(patch);
        this.undo.notify('Targets updated');
        await this.router.navigate(['/today']);
        return;
      }
      if (this.useLegacy()) {
        const r = await this.data.importLegacy();
        this.undo.notify(
          `Imported ${r.foods} foods, ${r.menus} menus, ${r.body + r.measurements} progress entries`
        );
      }
      if (this.useStarter()) await this.data.seedStarter();
      await this.profile.update({ ...patch, onboarded: true });
      await this.router.navigate(['/today']);
    } catch (e) {
      console.error(e);
      this.undo.notify('Something went wrong. Please try again.');
    } finally {
      this.busy.set('');
    }
  }
}
