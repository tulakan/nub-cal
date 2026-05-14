import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../shared/modules/material.module';
import { FoodService } from '../../shared/services/food.service';
import { MenuService } from '../../shared/services/menu.service';
import { Food } from '../../shared/interface/food.interface';
import { Menu, MenuIngredient } from '../../shared/interface/menu.interface';
import { DialogLayoutComponent } from '../../shared/components/dialog-layout.component';

@Component({
  selector: 'app-create-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, DialogLayoutComponent],
  templateUrl: './create-menu.component.html',
  styleUrls: ['./create-menu.component.scss'],
})
export class CreateMenuComponent implements OnInit {
  private foodService = inject(FoodService);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateMenuComponent>);
  public data = inject(MAT_DIALOG_DATA, { optional: true });

  foods: Food[] = [];
  newMenuName: string = '';
  foodSearchTerm: string = '';
  selectedFood: Food | null = null;
  ingredientQuantity: number = 0;
  currentMenuIngredients: (MenuIngredient & { food?: Food })[] = [];
  filteredFoods: Food[] = [];

  ngOnInit() {
    this.loadFoods();
  }

  loadFoods() {
    this.foodService.getFoodListRealtime(foods => {
      this.foods = foods;
      this.filteredFoods = foods;

      if (this.data && this.data.menu) {
        const menu = this.data.menu;
        this.newMenuName = menu.name;
        this.currentMenuIngredients = menu.ingredients.map((ing: any) => {
          const food = this.foods.find(f => f.id === ing.foodId);
          return { ...ing, food };
        });
      }
    });
  }

  onFoodSearchChange() {
    const term = this.foodSearchTerm.toLowerCase();
    this.filteredFoods = this.foods.filter(food =>
      food.name.toLowerCase().includes(term)
    );
  }



  onFoodSelected(event: any) {
    this.selectedFood = event.option.value;
    this.foodSearchTerm = this.selectedFood ? this.selectedFood.name : '';
  }

  addIngredient() {
    if (!this.selectedFood || this.ingredientQuantity <= 0) {
      this.snackBar.open('Please select a food and enter a valid quantity', 'Close', { duration: 3000 });
      return;
    }

    this.currentMenuIngredients.push({
      foodId: this.selectedFood.id,
      quantity: this.ingredientQuantity,
      food: this.selectedFood,
    });

    // Reset
    this.selectedFood = null;
    this.foodSearchTerm = '';
    this.ingredientQuantity = 0;
    this.filteredFoods = this.foods;
  }

  removeIngredient(index: number) {
    this.currentMenuIngredients.splice(index, 1);
  }

  calculateMenuMacros() {
    let kcal = 0, protein = 0, carb = 0, fat = 0;
    this.currentMenuIngredients.forEach(item => {
      if (item.food) {
        const factor = item.quantity / item.food.servingSize;
        kcal += item.food.kcal * factor;
        protein += item.food.protein * factor;
        carb += item.food.carb * factor;
        fat += item.food.fat * factor;
      }
    });
    return { kcal, protein, carb, fat };
  }

  async saveMenu() {
    if (!this.newMenuName || this.currentMenuIngredients.length === 0) {
      this.snackBar.open('Please enter a menu name and add at least one ingredient', 'Close', { duration: 3000 });
      return;
    }

    const menuData: Menu = {
      name: this.newMenuName,
      ingredients: this.currentMenuIngredients.map(item => ({
        foodId: item.foodId,
        quantity: item.quantity,
      })),
    };

    try {
      if (this.data && this.data.menu) {
        await this.menuService.updateMenu(this.data.menu.id, menuData);
        this.snackBar.open(`Successfully updated "${this.newMenuName}"`, 'Close', { duration: 3000 });
      } else {
        await this.menuService.addMenu(menuData);
        this.snackBar.open(`Successfully saved "${this.newMenuName}"`, 'Close', { duration: 3000 });
      }
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving menu:', error);
      this.snackBar.open('Failed to save menu. Please try again.', 'Close', { duration: 3000 });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
