import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogLayoutComponent } from '../../shared/components/dialog-layout.component';
import { Food } from '../../shared/interface/food.interface';
import { Menu, MenuIngredient } from '../../shared/interface/menu.interface';
import { MaterialModule } from '../../shared/modules/material.module';
import { FoodService } from '../../shared/services/food.service';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-create-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    DialogLayoutComponent,
  ],
  templateUrl: './create-menu.component.html',
  styleUrls: ['./create-menu.component.scss'],
})
export class CreateMenuComponent implements OnInit {
  private foodService = inject(FoodService);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialogRef = inject(MatDialogRef<CreateMenuComponent>, {
    optional: true,
  });
  public data = inject(MAT_DIALOG_DATA, { optional: true });

  foods: Food[] = [];
  newMenuName: string = '';
  foodSearchTerm: any = '';
  selectedFoodId: string | null = null;
  selectedFood: Food | null = null;
  ingredientQuantity: number = 0;
  currentMenuIngredients: (MenuIngredient & { food?: Food })[] = [];
  filteredFoods: Food[] = [];
  isPageMode = false;
  editMenuId: string | null = null;

  ngOnInit() {
    // Check if we're in page mode or dialog mode
    this.isPageMode = !this.dialogRef;

    // Get menu ID from route params if in edit mode
    if (this.isPageMode) {
      this.editMenuId = this.route.snapshot.paramMap.get('id');
    }

    this.loadFoods();
  }

  displayFoodName = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name || '';
  };

  trackByFoodId(index: number, food: Food): string {
    return food.id;
  }

  private menuLoaded = false;

  loadFoods() {
    this.foodService.getFoodListRealtime(foods => {
      this.foods = foods;
      this.filteredFoods = foods;

      if (this.menuLoaded) return;
      this.menuLoaded = true;

      if (this.data && this.data.menu) {
        const menu = this.data.menu;
        this.newMenuName = menu.name;
        this.currentMenuIngredients = menu.ingredients.map((ing: any) => {
          const food = this.foods.find(f => f.id === ing.foodId);
          return { ...ing, food };
        });
      } else if (this.isPageMode && this.editMenuId) {
        this.loadMenuForEdit();
      }
    });
  }

  private async loadMenuForEdit() {
    try {
      const [menu, allFoods] = await Promise.all([
        this.menuService.getMenuById(this.editMenuId!),
        this.foodService.getFoodList(),
      ]);
      if (menu) {
        this.newMenuName = menu.name;
        this.currentMenuIngredients = menu.ingredients.map((ing: any) => {
          const food = allFoods.find((f: any) => f.id === ing.foodId);
          return { ...ing, food };
        });
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      this.snackBar.open('Failed to load menu', 'Close', { duration: 3000 });
    }
  }

  onFoodSearchChange() {
    if (typeof this.foodSearchTerm !== 'string') return;
    const term = this.foodSearchTerm.toLowerCase();
    this.filteredFoods = this.foods.filter(food =>
      food.name.toLowerCase().includes(term)
    );
    if (this.selectedFood && this.foodSearchTerm !== this.selectedFood.name) {
      this.selectedFoodId = null;
      this.selectedFood = null;
    }
  }

  onFoodSelected(event: any) {
    const food = event.option.value as Food;
    this.selectedFoodId = food.id;
    this.selectedFood = food;
    this.foodSearchTerm = food.name;
    this.filteredFoods = this.foods;
  }

  addIngredient() {
    if (!this.selectedFood || this.ingredientQuantity <= 0) {
      this.snackBar.open(
        'Please select a food and enter a valid quantity',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.currentMenuIngredients.push({
      foodId: this.selectedFood.id,
      quantity: this.ingredientQuantity,
      food: this.selectedFood,
    });

    // Reset
    this.selectedFood = null;
    this.selectedFoodId = null;
    this.foodSearchTerm = '';
    this.ingredientQuantity = 0;
    this.filteredFoods = this.foods;
  }

  removeIngredient(index: number) {
    this.currentMenuIngredients.splice(index, 1);
  }

  calculateMenuMacros() {
    let kcal = 0,
      protein = 0,
      carb = 0,
      fat = 0;
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
      this.snackBar.open(
        'Please enter a menu name and add at least one ingredient',
        'Close',
        { duration: 3000 }
      );
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
      if (this.editMenuId || (this.data && this.data.menu)) {
        const menuId = this.editMenuId || this.data.menu.id;
        await this.menuService.updateMenu(menuId, menuData);
        this.snackBar.open(
          `Successfully updated "${this.newMenuName}"`,
          'Close',
          { duration: 3000 }
        );
      } else {
        await this.menuService.addMenu(menuData);
        this.snackBar.open(
          `Successfully saved "${this.newMenuName}"`,
          'Close',
          { duration: 3000 }
        );
      }

      if (this.isPageMode) {
        this.goBack();
      } else {
        this.dialogRef?.close(true);
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      this.snackBar.open('Failed to save menu. Please try again.', 'Close', {
        duration: 3000,
      });
    }
  }

  onCancel() {
    if (this.isPageMode) {
      this.goBack();
    } else {
      this.dialogRef?.close();
    }
  }

  goBack() {
    this.router.navigate(['/menu-plan']);
  }
}
