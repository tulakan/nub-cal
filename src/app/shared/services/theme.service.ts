import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  warn: string;
  warnLight: string;
  warnDark: string;
  success: string;
  error: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  isDarkTheme$ = this.isDarkTheme.asObservable();

  constructor() {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('dark-theme');
    if (savedTheme) {
      this.setDarkTheme(JSON.parse(savedTheme));
    }
  }

  setDarkTheme(isDark: boolean): void {
    this.isDarkTheme.next(isDark);
    localStorage.setItem('dark-theme', JSON.stringify(isDark));

    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  toggleTheme(): void {
    this.setDarkTheme(!this.isDarkTheme.value);
  }

  getCurrentTheme(): boolean {
    return this.isDarkTheme.value;
  }

  // Get current theme colors
  getThemeColors(): ThemeColors {
    const isDark = this.isDarkTheme.value;

    return {
      primary: '#4CAF50',
      primaryLight: '#81C784',
      primaryDark: '#388E3C',
      secondary: '#2196F3',
      secondaryLight: '#64B5F6',
      secondaryDark: '#1976D2',
      warn: '#FF9800',
      warnLight: '#FFB74D',
      warnDark: '#F57C00',
      success: '#4CAF50',
      error: '#F44336',
      background: isDark ? '#303030' : '#FAFAFA',
      surface: isDark ? '#424242' : '#FFFFFF',
      textPrimary: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
      textSecondary: isDark
        ? 'rgba(255, 255, 255, 0.54)'
        : 'rgba(0, 0, 0, 0.54)',
    };
  }

  // Utility methods for health/fitness app specific colors
  getCalorieColor(calories: number, target: number): string {
    const percentage = (calories / target) * 100;

    if (percentage < 80) {
      return this.getThemeColors().warn; // Under target
    } else if (percentage <= 110) {
      return this.getThemeColors().success; // Within target range
    } else {
      return this.getThemeColors().error; // Over target
    }
  }

  getWeightChangeColor(change: number): string {
    const colors = this.getThemeColors();

    if (change < -0.5) {
      return colors.success; // Weight loss
    } else if (change > 0.5) {
      return colors.warn; // Weight gain
    } else {
      return colors.secondary; // Stable weight
    }
  }

  getProgressColor(progress: number): string {
    const colors = this.getThemeColors();

    if (progress < 30) {
      return colors.error;
    } else if (progress < 70) {
      return colors.warn;
    } else {
      return colors.success;
    }
  }
}
