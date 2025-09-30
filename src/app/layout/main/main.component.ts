import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
        <span>Health Tracker</span>
        <!-- <span class="spacer"></span> -->
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
          <!-- <button mat-icon-button color="primary">
            <mat-icon>restaurant</mat-icon>
          </button>
          <button mat-icon-button>
            <mat-icon>fitness_center</mat-icon>
          </button>
          <button mat-icon-button>
            <mat-icon>monitor_weight</mat-icon>
          </button> -->
          <button mat-icon-button>
            <mat-icon>egg_alt</mat-icon>
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

    .content-container {
      flex-grow: 1;
      width: 100%;
      padding: 8px;
      // overflow-y: auto;
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
      max-width: 300px;
      justify-content: space-around;
    }
  `,
})
export class MainComponent {
  constructor(public themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
