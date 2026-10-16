import { Component, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  Router,
  RouterOutlet,
} from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, first } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (!started()) {
      <!-- shown while guards restore the Firebase session -->
      <div class="splash" aria-label="Loading">
        <div class="logo"><span class="material-icons">eco</span></div>
      </div>
    }
    <router-outlet></router-outlet>
  `,
  styles: `
    .splash {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--c-white);
    }
    .logo {
      width: 72px;
      height: 72px;
      border-radius: 22px;
      background: var(--c-primary);
      color: var(--c-primary-ink);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 1.2s ease-in-out infinite;
    }
    .logo span {
      font-size: 36px;
    }
    @keyframes pulse {
      50% {
        transform: scale(0.94);
        opacity: 0.8;
      }
    }
  `,
})
export class AppComponent {
  started = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(
        filter(
          e =>
            e instanceof NavigationEnd ||
            e instanceof NavigationError ||
            // a guard redirect cancels first, then navigates again; keep the splash
            (e instanceof NavigationCancel &&
              e.code !== NavigationCancellationCode.Redirect)
        ),
        first()
      )
      .subscribe(() => this.started.set(true));

    const sw = inject(SwUpdate);
    const snack = inject(MatSnackBar);
    if (sw.isEnabled) {
      sw.versionUpdates
        .pipe(filter(e => e.type === 'VERSION_READY'))
        .subscribe(() => {
          snack
            .open('New version available', 'Reload', { duration: 0 })
            .onAction()
            .subscribe(() => document.location.reload());
        });
    }
  }
}
