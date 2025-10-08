import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, map, startWith } from 'rxjs';
import { DialogLayoutComponent } from '../../shared/components/dialog-layout.component';
import { Food } from '../../shared/interface/food.interface';
import { TargetMacros } from '../../shared/interface/nutrition.interface';
import { MaterialModule } from '../../shared/modules/material.module';
import { FoodService } from '../../shared/services/food.service';

@Component({
  selector: 'app-add-food',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    DialogLayoutComponent,
  ],
  templateUrl: './add-food.component.html',
  styleUrls: ['./add-food.component.scss'],
})
export class AddFoodComponent implements OnInit {
  private fb = inject(FormBuilder);
  private foodService = inject(FoodService);
  private dialogRef = inject(MatDialogRef<AddFoodComponent>);
  private data = inject(MAT_DIALOG_DATA);

  foodSearchForm!: FormGroup;
  filteredOptions!: Observable<Food[]>;

  // Current targets and consumed amounts
  currentTargets: TargetMacros = this.data?.currentTargets || {
    kcal: 2000,
    protein: 150,
    carb: 250,
    fat: 67,
  };
  currentConsumed = this.data?.currentConsumed || {
    kcal: 0,
    protein: 0,
    carb: 0,
    fat: 0,
  };

  // Make Math available in template
  Math = Math;

  ngOnInit() {
    this.initForm();
    this.setupAutocomplete();
  }

  private initForm() {
    this.foodSearchForm = this.fb.group({
      selectedFood: [null, Validators.required],
      servingSize: [1, [Validators.required, Validators.min(0.1)]],
    });
  }

  private setupAutocomplete() {
    // Load foods first
    this.loadFoods();

    this.filteredOptions = this.foodSearchForm
      .get('selectedFood')!
      .valueChanges.pipe(
        startWith(''),
        map(value => {
          if (typeof value === 'string') {
            return this.filterFoods(value);
          }
          return this.allFoods;
        })
      );
  }

  allFoods: Food[] = [];

  private async loadFoods() {
    try {
      this.allFoods = (await this.foodService.getFoodList()) as Food[];
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  }

  private filterFoods(searchTerm: string): Food[] {
    if (!searchTerm.trim()) {
      return this.allFoods;
    }
    return this.allFoods.filter(food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  displayFoodName(food: Food): string {
    return food?.name || '';
  }

  get selectedFood(): Food | null {
    return this.foodSearchForm.get('selectedFood')?.value;
  }

  get servingSize(): number {
    return this.foodSearchForm.get('servingSize')?.value || 0;
  }

  get calculatedNutrition() {
    if (!this.selectedFood || this.servingSize <= 0) {
      return { kcal: 0, protein: 0, carb: 0, fat: 0 };
    }

    const ratio = this.servingSize / this.selectedFood.servingSize;
    return {
      kcal: Math.round(this.selectedFood.kcal * ratio * 10) / 10,
      protein: Math.round(this.selectedFood.protein * ratio * 10) / 10,
      carb: Math.round(this.selectedFood.carb * ratio * 10) / 10,
      fat: Math.round(this.selectedFood.fat * ratio * 10) / 10,
    };
  }

  get showPreview(): boolean {
    return !!(this.selectedFood && this.servingSize > 0);
  }

  get remainingAfterAdding() {
    if (!this.showPreview) {
      return {
        kcal: this.currentTargets.kcal - this.currentConsumed.kcal,
        protein: this.currentTargets.protein - this.currentConsumed.protein,
        carb: this.currentTargets.carb - this.currentConsumed.carb,
        fat: this.currentTargets.fat - this.currentConsumed.fat,
      };
    }

    const foodNutrition = this.calculatedNutrition;
    return {
      kcal:
        this.currentTargets.kcal -
        this.currentConsumed.kcal -
        foodNutrition.kcal,
      protein:
        this.currentTargets.protein -
        this.currentConsumed.protein -
        foodNutrition.protein,
      carb:
        this.currentTargets.carb -
        this.currentConsumed.carb -
        foodNutrition.carb,
      fat:
        this.currentTargets.fat - this.currentConsumed.fat - foodNutrition.fat,
    };
  }

  onCancel() {
    this.dialogRef.close();
  }

  onAddFood() {
    if (this.foodSearchForm.valid && this.selectedFood) {
      const result = {
        food: this.selectedFood,
        servingSize: this.servingSize,
        calculatedNutrition: this.calculatedNutrition,
      };
      this.dialogRef.close(result);
    }
  }

  // Dialog layout event handlers
  onSave() {
    this.onAddFood();
  }

  onCloseDialog() {
    this.dialogRef.close();
  }
}
