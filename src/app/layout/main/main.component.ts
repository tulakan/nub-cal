import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { DemoService } from '../../shared/services/demo.service';
import { ShellService } from '../../shared/services/shell.service';
import { ProfileStore } from '../../stores/profile.store';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatRippleModule,
  ],
  template: `
    <div class="shell">
      <header class="header">
        @if (data().back; as back) {
          <button
            type="button"
            class="icon-btn"
            aria-label="Back"
            (click)="goBack(back)"
          >
            <mat-icon>arrow_back</mat-icon>
          </button>
        }
        <div class="title-wrap">
          <div class="title">{{ data().title }}</div>
          @if (shell.subtitle()) {
            <div class="subtitle">{{ shell.subtitle() }}</div>
          }
        </div>
        @if (profile.profile()?.demo) {
          <button
            type="button"
            class="demo"
            aria-label="Demo mode. Tap to exit."
            [disabled]="demo.exiting()"
            (click)="demo.exit()"
          >
            Demo <span aria-hidden="true">✕</span>
          </button>
        }
        @for (a of shell.actions(); track a.ariaLabel) {
          @if (a.icon) {
            <button
              type="button"
              class="icon-btn"
              [attr.aria-label]="a.ariaLabel"
              [disabled]="a.disabled?.()"
              (click)="a.onClick()"
            >
              <mat-icon>{{ a.icon }}</mat-icon>
            </button>
          } @else {
            <button
              type="button"
              class="text-btn"
              [attr.aria-label]="a.ariaLabel"
              [disabled]="a.disabled?.()"
              (click)="a.onClick()"
            >
              {{ a.label }}
            </button>
          }
        }
      </header>

      <main class="content">
        <router-outlet />
      </main>

      @if (data().nav !== false) {
        <nav class="nav" aria-label="Main">
          @for (n of items; track n.path) {
            <a
              matRipple
              class="nav-item"
              [routerLink]="n.path"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
            >
              <mat-icon>{{ n.icon }}</mat-icon>
              <span>{{ n.label }}</span>
            </a>
          }
        </nav>
      }
    </div>
  `,
  styles: `
    .shell {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      width: 100%;
      max-width: var(--app-w);
      margin: 0 auto;
      background: var(--c-white);
    }
    @media (min-width: 600px) {
      .shell {
        border-inline: var(--border);
      }
    }
    .header {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      min-height: calc(var(--header-h) + var(--safe-top));
      padding: var(--safe-top) var(--space-sm) 0 var(--space-lg);
      background: var(--c-white);
      border-bottom: var(--border);
    }
    .header:has(.icon-btn:first-child) {
      padding-left: var(--space-xs);
    }
    .title-wrap {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: baseline;
      gap: var(--space-sm);
    }
    .title {
      font-size: var(--fs-subtitle);
      font-weight: 700;
      color: var(--c-black);
      white-space: nowrap;
    }
    .subtitle {
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon-btn {
      width: 44px;
      height: 44px;
      border: 0;
      background: transparent;
      border-radius: 50%;
      color: var(--c-gray-800);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .text-btn {
      min-height: 44px;
      padding: 0 var(--space-md);
      border: 0;
      background: transparent;
      font: inherit;
      font-size: var(--fs-body);
      font-weight: 500;
      color: var(--c-black);
      cursor: pointer;
    }
    .demo {
      min-height: 28px;
      padding: 0 var(--space-sm);
      border: 0;
      border-radius: 14px;
      background: var(--c-carb-bg);
      color: var(--c-carb-text);
      font: inherit;
      font-size: var(--fs-caption);
      font-weight: 700;
      cursor: pointer;
    }
    .icon-btn:disabled,
    .text-btn:disabled {
      opacity: 0.4;
    }
    .content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: var(--space-sm) var(--space-sm) calc(var(--space-xl) + 56px);
    }
    .nav {
      flex: none;
      display: flex;
      height: calc(var(--nav-h) + var(--safe-bottom));
      padding-bottom: var(--safe-bottom);
      background: var(--c-white);
      border-top: var(--border);
    }
    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      color: var(--c-gray-600);
      text-decoration: none;
      font-size: var(--fs-caption);
    }
    .nav-item mat-icon {
      width: 56px;
      height: 28px;
      font-size: 22px;
      line-height: 28px;
      text-align: center;
      border-radius: 14px;
      transition: background-color 150ms ease;
    }
    .nav-item.active {
      color: var(--c-primary-ink);
      font-weight: 700;
    }
    .nav-item.active mat-icon {
      background: var(--c-primary);
    }
  `,
})
export class MainComponent {
  private router = inject(Router);
  shell = inject(ShellService);
  profile = inject(ProfileStore);
  demo = inject(DemoService);

  items: NavItem[] = [
    { path: '/today', label: 'Today', icon: 'restaurant' },
    { path: '/plan', label: 'Plan', icon: 'event_note' },
    { path: '/foods', label: 'Foods', icon: 'menu_book' },
    { path: '/progress', label: 'Progress', icon: 'show_chart' },
  ];

  private routeData = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let r = this.router.routerState.snapshot.root;
        while (r.firstChild) r = r.firstChild;
        return r.data as { title?: string; nav?: boolean; back?: string };
      })
    ),
    { initialValue: {} as { title?: string; nav?: boolean; back?: string } }
  );

  data = computed(() => ({
    title: this.routeData().title ?? 'Nub Cal',
    nav: this.routeData().nav,
    back: this.routeData().back,
  }));

  goBack(path: string) {
    this.router.navigateByUrl(path);
  }
}
