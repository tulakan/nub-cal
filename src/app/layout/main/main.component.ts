import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import * as packageInfo from '../../../../package.json';
import { MaterialModule } from '../../shared/modules/material.module';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, MaterialModule, CommonModule],
  template: `
    <div class="full-page-container">
      <mat-toolbar class="main-toolbar" color="primary">
        <!-- <button mat-icon-button>
          <mat-icon>menu</mat-icon>
        </button> -->
        <span>Nub KCal</span>
        <span class="spacer"></span>
        <!-- <span class="version-text">v{{ version }}</span> -->
        <!-- <button
          mat-icon-button
          (click)="toggleTheme()"
          matTooltip="Toggle theme"
        >
          <mat-icon>{{
            (themeService.isDarkTheme$ | async) ? 'light_mode' : 'dark_mode'
          }}</mat-icon>
        </button> -->
      </mat-toolbar>
      <div class="content-container">
        <router-outlet></router-outlet>
      </div>
      <div class="footer bg-surface">
        <nav class="bottom-nav">
          <button
            mat-icon-button
            (click)="navigateToFoodLog()"
            matTooltip="Food Log"
          >
            <mat-icon>restaurant</mat-icon>
          </button>
          <button
            mat-icon-button
            (click)="navigateToMenuPlan()"
            matTooltip="Menu & Plan"
          >
            <mat-icon>restaurant_menu</mat-icon>
          </button>
          <button
            mat-icon-button
            (click)="navigateToFoodList()"
            matTooltip="Food List"
          >
            <mat-icon>list_alt</mat-icon>
          </button>
          <button
            mat-icon-button
            matTooltip="Body Composition"
            (click)="navigateToBodyComposition()"
          >
            <mat-icon>monitor_weight</mat-icon>
          </button>
          <button
            mat-icon-button
            matTooltip="Circumference"
            (click)="navigateToCircumference()"
          >
            <mat-icon>straighten</mat-icon>
          </button>
        </nav>
      </div>
    </div>
  `,
  styles: `
    .full-page-container {
      width: 100%;
      height: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
    }

    .main-toolbar {
      min-height: 48px;
      height: 48px;
    }
    .spacer {
      flex: 1 1 auto;
    }

    .version-text {
      font-size: 0.8em;
      opacity: 0.8;
    }

    .content-container {
      flex-grow: 1;
      width: 100%;
      padding: 8px;
      overflow-y: scroll;
    }

    .footer {
      width: 100%;
      height: 64px;
      // border-top: 1px solid var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bottom-nav {
      display: flex;
      gap: 24px;
      width: 100%;
      max-width: 400px;
      justify-content: space-around;
    }
  `,
})
export class MainComponent {
  private router = inject(Router);
  version = packageInfo.version;

  constructor(public themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  navigateToFoodLog(): void {
    this.router.navigate(['/food-log']);
  }

  navigateToMenuPlan(): void {
    this.router.navigate(['/menu-plan']);
  }

  navigateToFoodList(): void {
    this.router.navigate(['/food-list']);
  }

  navigateToBodyComposition(): void {
    this.router.navigate(['/body-composition']);
  }

  navigateToCircumference(): void {
    this.router.navigate(['/circumference']);
  }
}

// todo: target / add food log to dialog / move remain kcal to top and re ui /
