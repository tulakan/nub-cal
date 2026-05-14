import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddFoodComponent } from '../../dialogs/add-food/add-food.component';
import { TargetDialogComponent } from '../../dialogs/target-dialog/target-dialog.component';
import { Food } from '../../shared/interface/food.interface';
import {
  LoggedFood,
  TargetMacros,
} from '../../shared/interface/nutrition.interface';
import { MaterialModule } from '../../shared/modules/material.module';
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { StoreService } from '../../stores/store.service';

@Component({
  selector: 'app-food-log',
  standalone: true,
  imports: [MaterialModule, CommonModule, DragDropModule],
  templateUrl: './food-log.component.html',
  styleUrls: ['./food-log.component.scss'],
})
export class FoodLogPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  store = inject(StoreService);

  // Make Math available in template
  Math = Math;

  // Local storage keys
  private readonly LOGGED_FOODS_KEY = 'food-log-logged-foods';
  private readonly TARGET_MACROS_KEY = 'food-log-target-macros';

  // Signals for reactive state management
  targetMacros = signal<TargetMacros>({
    kcal: 2000,
    protein: 150,
    carb: 250,
    fat: 67,
  });

  loggedFoods = signal<LoggedFood[]>([]);
  allFoods = signal<Food[]>([]);
  filteredFoods = signal<Food[]>([]);

  // Computed values
  totalConsumed = computed(() => {
    const foods = this.loggedFoods();
    return foods.reduce(
      (acc, loggedFood) => ({
        kcal: acc.kcal + loggedFood.calculatedNutrition.kcal,
        protein: acc.protein + loggedFood.calculatedNutrition.protein,
        carb: acc.carb + loggedFood.calculatedNutrition.carb,
        fat: acc.fat + loggedFood.calculatedNutrition.fat,
      }),
      { kcal: 0, protein: 0, carb: 0, fat: 0 }
    );
  });

  remainingMacros = computed(() => {
    const target = this.targetMacros();
    const consumed = this.totalConsumed();
    return {
      kcal: target.kcal - consumed.kcal,
      protein: target.protein - consumed.protein,
      carb: target.carb - consumed.carb,
      fat: target.fat - consumed.fat,
    };
  });

  constructor() {}

  async ngOnInit() {
    this.loadFromLocalStorage();
  }

  openAddFoodDialog() {
    const dialogRef = this.dialog.open(AddFoodComponent, {
      width: '700px',
      height: '90vh',
      maxWidth: '95vw',
      disableClose: false,
      autoFocus: true,
      data: {
        currentTargets: this.targetMacros(),
        currentConsumed: this.totalConsumed(),
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const loggedFood: LoggedFood = {
          food: result.food,
          servingSize: result.servingSize,
          calculatedNutrition: result.calculatedNutrition,
        };

        // Add to logged foods
        this.loggedFoods.update(foods => [...foods, loggedFood]);

        // Save to local storage
        this.saveToLocalStorage();

        // Show success message
        this.snackBar.open(`${result.food.name} added to your log`, 'Close', {
          duration: 2000,
        });
      }
    });
  }

  removeFood(index: number) {
    const foodName = this.loggedFoods()[index]?.food.name;
    this.loggedFoods.update(foods => foods.filter((_, i) => i !== index));
    this.saveToLocalStorage();

    if (foodName) {
      this.snackBar.open(`${foodName} removed from your log`, 'Close', {
        duration: 2000,
      });
    }
  }

  onDragEnded(event: any, index: number) {
    const distance = event.distance.x;
    if (Math.abs(distance) > 100) {
      this.removeFood(index);
    } else {
      event.source.reset();
    }
  }

  openTargetDialog() {
    const dialogRef = this.dialog.open(TargetDialogComponent, {
      width: '500px',
      maxHeight: '80vh',
      maxWidth: '90vw',
      data: {
        currentTargets: this.targetMacros(),
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.targetMacros.set(result);
        this.saveToLocalStorage();
      }
    });
  }

  getProgressPercentage(current: number, target: number): number {
    return Math.min((current / target) * 100, 100);
  }

  getMacroStatus(
    current: number,
    target: number
  ): 'primary' | 'accent' | 'warn' {
    const percentage = (current / target) * 100;
    if (percentage < 80) return 'primary';
    if (percentage <= 100) return 'accent';
    return 'warn';
  }

  // Local Storage Methods
  private saveToLocalStorage() {
    try {
      localStorage.setItem(
        this.LOGGED_FOODS_KEY,
        JSON.stringify(this.loggedFoods())
      );
      localStorage.setItem(
        this.TARGET_MACROS_KEY,
        JSON.stringify(this.targetMacros())
      );
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      // Load logged foods
      const savedLoggedFoods = localStorage.getItem(this.LOGGED_FOODS_KEY);
      if (savedLoggedFoods) {
        const loggedFoods = JSON.parse(savedLoggedFoods) as LoggedFood[];
        this.loggedFoods.set(loggedFoods);
      }

      // Load target macros
      const savedTargetMacros = localStorage.getItem(this.TARGET_MACROS_KEY);
      if (savedTargetMacros) {
        const targetMacros = JSON.parse(savedTargetMacros) as TargetMacros;
        this.targetMacros.set(targetMacros);
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
  }

  // Reset Methods with Confirmation
  resetLoggedFoods() {
    if (this.loggedFoods().length === 0) {
      this.snackBar.open('No foods to clear', 'Close', { duration: 2000 });
      return;
    }

    if (
      confirm(
        'Are you sure you want to clear all logged foods? This action cannot be undone.'
      )
    ) {
      this.loggedFoods.set([]);
      this.saveToLocalStorage();
      this.snackBar.open('All logged foods cleared successfully', 'Close', {
        duration: 3000,
      });
    }
  }

  resetTargetMacros() {
    if (
      confirm('Are you sure you want to reset your targets to default values?')
    ) {
      const defaultTargets: TargetMacros = {
        kcal: 2000,
        protein: 150,
        carb: 250,
        fat: 67,
      };
      this.targetMacros.set(defaultTargets);
      this.saveToLocalStorage();
      this.snackBar.open('Target macros reset to defaults', 'Close', {
        duration: 3000,
      });
    }
  }

  resetAll() {
    if (
      confirm(
        'Are you sure you want to reset everything? This will clear all logged foods and reset targets to defaults. This action cannot be undone.'
      )
    ) {
      const defaultTargets: TargetMacros = {
        kcal: 2000,
        protein: 150,
        carb: 250,
        fat: 67,
      };
      this.loggedFoods.set([]);
      this.targetMacros.set(defaultTargets);
      this.saveToLocalStorage();
      this.snackBar.open('Everything has been reset successfully', 'Close', {
        duration: 3000,
      });
    }
  }

  // Clear local storage completely
  clearLocalStorage() {
    if (
      confirm(
        'Are you sure you want to permanently delete all your food log data? This action cannot be undone and will remove all saved information.'
      )
    ) {
      try {
        localStorage.removeItem(this.LOGGED_FOODS_KEY);
        localStorage.removeItem(this.TARGET_MACROS_KEY);
        const defaultTargets: TargetMacros = {
          kcal: 2000,
          protein: 150,
          carb: 250,
          fat: 67,
        };
        this.loggedFoods.set([]);
        this.targetMacros.set(defaultTargets);
        this.snackBar.open('All data cleared and reset to defaults', 'Close', {
          duration: 3000,
        });
      } catch (error) {
        console.error('Error clearing local storage:', error);
        this.snackBar.open('Error clearing data. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    }
  }

  clearFoodLogs() {
    if (
      confirm(
        'Are you sure you want to permanently delete all your food log data? This action cannot be undone and will remove all saved information.'
      )
    ) {
      try {
        localStorage.removeItem(this.LOGGED_FOODS_KEY);
        this.loggedFoods.set([]);

        this.snackBar.open('All food log data cleared ', 'Close', {
          duration: 3000,
        });
      } catch (error) {
        console.error('Error clearing local storage:', error);
        this.snackBar.open('Error clearing data. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    }
  }
}
