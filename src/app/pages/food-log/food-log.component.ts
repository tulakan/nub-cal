import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs/operators';
import { Food } from '../../shared/interface/food.interface';
import { MaterialModule } from '../../shared/modules/material.module';
import { FoodService } from '../../shared/services/food.service';
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { StoreService } from '../../stores/store.service';

export interface TargetMacros {
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export interface LoggedFood {
  food: Food;
  servingSize: number;
  calculatedNutrition: {
    kcal: number;
    protein: number;
    carb: number;
    fat: number;
  };
}

@Component({
  selector: 'app-food-log',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './food-log.component.html',
  styleUrls: ['./food-log.component.scss'],
})
export class FoodLogPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private foodService = inject(FoodService);
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

  // Forms
  targetForm!: FormGroup;
  foodSearchForm!: FormGroup;

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

  // Observable for autocomplete
  filteredOptions!: Observable<Food[]>;

  constructor() {}

  async ngOnInit() {
    this.initializeForms();
    await this.loadFoods();
    this.setupAutocomplete();
    this.loadFromLocalStorage();
  }

  private initializeForms() {
    // Target macros form
    this.targetForm = this.fb.group({
      kcal: [
        this.targetMacros().kcal,
        [Validators.required, Validators.min(1)],
      ],
      protein: [
        this.targetMacros().protein,
        [Validators.required, Validators.min(1)],
      ],
      carb: [
        this.targetMacros().carb,
        [Validators.required, Validators.min(1)],
      ],
      fat: [this.targetMacros().fat, [Validators.required, Validators.min(1)]],
    });

    // Food search form
    this.foodSearchForm = this.fb.group({
      selectedFood: [null, Validators.required],
      servingSize: [1, [Validators.required, Validators.min(0.1)]],
    });

    // Listen to target form changes
    this.targetForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        if (this.targetForm.valid) {
          this.targetMacros.set(values);
        }
      });
  }

  private async loadFoods() {
    try {
      const foods = await this.foodService.getFoodList();
      this.allFoods.set(foods as Food[]);
      this.filteredFoods.set(foods as Food[]);
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  }

  private setupAutocomplete() {
    this.filteredOptions = this.foodSearchForm
      .get('selectedFood')!
      .valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        map(value => {
          if (typeof value === 'string') {
            return this.filterFoods(value);
          }
          return this.allFoods();
        })
      );
  }

  private filterFoods(searchTerm: string): Food[] {
    if (!searchTerm.trim()) {
      return this.allFoods();
    }
    const filtered = this.allFoods().filter(food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.filteredFoods.set(filtered);
    return filtered;
  }

  displayFoodName(food: Food): string {
    return food ? food.name : '';
  }

  addFood() {
    if (this.foodSearchForm.valid) {
      const selectedFood = this.foodSearchForm.get('selectedFood')!.value;
      const servingSize = this.foodSearchForm.get('servingSize')!.value;

      if (selectedFood && servingSize > 0) {
        const multiplier = servingSize / selectedFood.servingSize;

        const loggedFood: LoggedFood = {
          food: selectedFood,
          servingSize: servingSize,
          calculatedNutrition: {
            kcal: Math.round(selectedFood.kcal * multiplier * 100) / 100,
            protein: Math.round(selectedFood.protein * multiplier * 100) / 100,
            carb: Math.round(selectedFood.carb * multiplier * 100) / 100,
            fat: Math.round(selectedFood.fat * multiplier * 100) / 100,
          },
        };

        // Add to logged foods
        this.loggedFoods.update(foods => [...foods, loggedFood]);

        // Save to local storage
        this.saveToLocalStorage();

        // Show success message
        this.snackBar.open(`${selectedFood.name} added to your log`, 'Close', {
          duration: 2000,
        });

        // Reset form
        this.foodSearchForm.patchValue({
          selectedFood: null,
          servingSize: 1,
        });
      }
    }
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

  updateTargets() {
    if (this.targetForm.valid) {
      this.targetMacros.set(this.targetForm.value);
      this.saveToLocalStorage();
      this.snackBar.open('Target macros updated successfully', 'Close', {
        duration: 2000,
      });
    }
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
        // Update form with loaded values
        this.targetForm.patchValue(targetMacros);
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
      this.targetForm.patchValue(defaultTargets);
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
      this.targetForm.patchValue(defaultTargets);
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
        this.targetForm.patchValue(defaultTargets);
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
}
