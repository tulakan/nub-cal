import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MaterialModule } from './shared/modules/material.module';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-theme-demo',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  template: `
    <div class="demo-container">
      <h2>Health Tracker Theme Demo</h2>

      <!-- Color Palette Display -->
      <mat-card class="color-palette-card">
        <mat-card-header>
          <mat-card-title>Color Palette</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="color-grid">
            <div class="color-item">
              <div class="color-swatch bg-primary"></div>
              <span>Primary (Health Green)</span>
            </div>
            <div class="color-item">
              <div
                class="color-swatch"
                style="background-color: var(--secondary-color)"
              ></div>
              <span>Secondary (Trust Blue)</span>
            </div>
            <div class="color-item">
              <div
                class="color-swatch"
                style="background-color: var(--warn-color)"
              ></div>
              <span>Warn (Alert Orange)</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Health Metrics Examples -->
      <mat-card class="metrics-card">
        <mat-card-header>
          <mat-card-title>Health Metrics Color Coding</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="metric-example">
            <h4>Daily Calories</h4>
            <div class="calorie-examples">
              <div class="calories-positive">1,800 / 2,000 cal (90%)</div>
              <div class="calories-negative">1,400 / 2,000 cal (70%)</div>
              <div class="calories-over">2,300 / 2,000 cal (115%)</div>
            </div>
          </div>

          <div class="metric-example">
            <h4>Weight Change</h4>
            <div class="weight-examples">
              <div class="weight-loss">-1.2 kg (Loss)</div>
              <div class="weight-stable">+0.1 kg (Stable)</div>
              <div class="weight-gain">+0.8 kg (Gain)</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Button Examples -->
      <mat-card class="buttons-card">
        <mat-card-header>
          <mat-card-title>UI Components</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="button-examples">
            <button mat-raised-button color="primary">Log Food</button>
            <button mat-raised-button color="accent">View Progress</button>
            <button mat-raised-button color="warn">Set Goal</button>
            <button mat-stroked-button>Cancel</button>
          </div>

          <div class="form-examples">
            <mat-form-field appearance="outline">
              <mat-label>Food Item</mat-label>
              <input matInput placeholder="Enter food name" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Calories</mat-label>
              <input matInput type="number" placeholder="0" />
            </mat-form-field>
          </div>

          <div class="progress-examples">
            <h4>Progress Indicators</h4>
            <mat-progress-bar
              mode="determinate"
              [value]="25"
              color="warn"
            ></mat-progress-bar>
            <mat-progress-bar
              mode="determinate"
              [value]="60"
              color="accent"
            ></mat-progress-bar>
            <mat-progress-bar
              mode="determinate"
              [value]="85"
              color="primary"
            ></mat-progress-bar>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .demo-container {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }

    .color-palette-card,
    .metrics-card,
    .buttons-card {
      margin-bottom: 16px;
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .color-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .color-swatch {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .metric-example {
      margin-bottom: 24px;
    }

    .metric-example h4 {
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .calorie-examples,
    .weight-examples {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-weight: 500;
    }

    .button-examples {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .form-examples {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .form-examples mat-form-field {
      flex: 1;
      min-width: 200px;
    }

    .progress-examples {
      margin-top: 16px;
    }

    .progress-examples mat-progress-bar {
      margin-bottom: 12px;
    }

    .progress-examples h4 {
      margin-bottom: 12px;
      color: var(--text-primary);
    }
  `,
})
export class ThemeDemoComponent {
  constructor(public themeService: ThemeService) {}
}
