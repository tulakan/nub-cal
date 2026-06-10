import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DialogLayoutComponent } from '../../shared/components/dialog-layout.component';
import { Food } from '../../shared/interface/food.interface';

interface DialogData {
  food?: Food;
  isEdit: boolean;
}

@Component({
  selector: 'app-food-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    DialogLayoutComponent,
  ],
  templateUrl: './food-info.component.html',
  styleUrls: ['./food-info.component.scss'],
})
export class FoodInfoComponent implements OnInit {
  foodForm: FormGroup;
  isEdit: boolean;

  units = [
    'g',
    'kg',
    'oz',
    'lb',
    'ml',
    'l',
    'cup',
    'tbsp',
    'tsp',
    'piece',
    'slice',
    'serving',
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FoodInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEdit = data?.isEdit || false;
    this.foodForm = this.createForm();
  }

  ngOnInit() {
    if (this.isEdit && this.data.food) {
      this.populateForm(this.data.food);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      kcal: [
        '',
        [Validators.required, Validators.min(0), Validators.max(9999)],
      ],
      protein: [
        '',
        [Validators.required, Validators.min(0), Validators.max(999)],
      ],
      carb: ['', [Validators.required, Validators.min(0), Validators.max(999)]],
      fat: ['', [Validators.required, Validators.min(0), Validators.max(999)]],
      servingSize: [
        '',
        [Validators.required, Validators.min(0.1), Validators.max(9999)],
      ],
      unit: ['g', [Validators.required]],
    });
  }

  private populateForm(food: Food) {
    this.foodForm.patchValue({
      name: food.name,
      kcal: food.kcal,
      protein: food.protein,
      carb: food.carb,
      fat: food.fat,
      servingSize: food.servingSize,
      unit: food.unit,
    });
  }

  onSave() {
    this.onSubmit();
  }

  onSubmit() {
    if (this.foodForm.valid) {
      const formValue = this.foodForm.value;
      const foodData: Food = {
        id: this.isEdit && this.data.food?.id ? this.data.food.id : '',
        name: formValue.name.trim(),
        kcal: Number(formValue.kcal),
        protein: Number(formValue.protein),
        carb: Number(formValue.carb),
        fat: Number(formValue.fat),
        servingSize: Number(formValue.servingSize),
        unit: formValue.unit,
      };

      this.dialogRef.close(foodData);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  private markFormGroupTouched() {
    Object.keys(this.foodForm.controls).forEach(key => {
      const control = this.foodForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.foodForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (control?.hasError('min')) {
      return `${this.getFieldDisplayName(fieldName)} must be greater than ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `${this.getFieldDisplayName(fieldName)} must be less than ${control.errors?.['max'].max}`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: 'Food name',
      kcal: 'Calories',
      protein: 'Protein',
      carb: 'Carbohydrates',
      fat: 'Fat',
      servingSize: 'Serving size',
      unit: 'Unit',
    };
    return displayNames[fieldName] || fieldName;
  }

  calculateTotalMacros(): number {
    const protein = Number(this.foodForm.get('protein')?.value) || 0;
    const carb = Number(this.foodForm.get('carb')?.value) || 0;
    const fat = Number(this.foodForm.get('fat')?.value) || 0;

    return protein * 4 + carb * 4 + fat * 9;
  }

  getCalorieDifference(): number {
    const calculatedCalories = this.calculateTotalMacros();
    const enteredCalories = Number(this.foodForm.get('kcal')?.value) || 0;
    const difference = calculatedCalories - enteredCalories;

    return Math.abs(difference);
  }

  getCalorieDifferenceWithSign(): string {
    const calculatedCalories = this.calculateTotalMacros();
    const enteredCalories = Number(this.foodForm.get('kcal')?.value) || 0;
    const difference = calculatedCalories - enteredCalories;

    return difference > 0 ? `+${difference}` : `${difference}`;
  }
}
