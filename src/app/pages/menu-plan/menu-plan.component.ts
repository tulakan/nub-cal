import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/modules/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FoodService } from '../../shared/services/food.service';
import { MenuService } from '../../shared/services/menu.service';
import { Food } from '../../shared/interface/food.interface';
import { Menu, MenuIngredient } from '../../shared/interface/menu.interface';

@Component({
  selector: 'app-menu-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './menu-plan.component.html',
  styleUrls: ['./menu-plan.component.scss'],
})
export class MenuPlanComponent implements OnInit {
  private foodService = inject(FoodService);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);

  foods: Food[] = [];
  menus: Menu[] = [];

  // For Creating Menu
  newMenuName: string = '';
  foodSearchTerm: string = '';
  selectedFood: Food | null = null;
  ingredientQuantity: number = 0;
  currentMenuIngredients: (MenuIngredient & { food?: Food })[] = [];
  filteredFoods: Food[] = [];

  // For Planning
  selectedMenuIds: string[] = [];
  plannedMenus: (Menu & { id: string; ingredients: (MenuIngredient & { food?: Food })[] })[] = [];

  ngOnInit() {
    this.loadFoods();
    this.loadMenus();
  }

  loadFoods() {
    this.foodService.getFoodListRealtime(foods => {
      this.foods = foods;
      this.filteredFoods = foods;
    });
  }

  loadMenus() {
    this.menuService.getMenuListRealtime(menus => {
      this.menus = menus;
    });
  }

  onFoodSearchChange() {
    const term = this.foodSearchTerm.toLowerCase();
    this.filteredFoods = this.foods.filter(food =>
      food.name.toLowerCase().includes(term)
    );
  }

  displayFoodName(food: Food): string {
    return food ? food.name : '';
  }

  onFoodSelected(event: any) {
    this.selectedFood = event.option.value;
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
      await this.menuService.addMenu(menuData);
      this.snackBar.open(`Successfully saved "${this.newMenuName}"`, 'Close', { duration: 3000 });
      this.newMenuName = '';
      this.currentMenuIngredients = [];
    } catch (error) {
      console.error('Error saving menu:', error);
      this.snackBar.open('Failed to save menu. Please try again.', 'Close', { duration: 3000 });
    }
  }

  onMenuSelectChange() {
    this.plannedMenus = this.selectedMenuIds.map(id => {
      const menu = this.menus.find(m => m.id === id);
      if (!menu) return null;

      // Deep copy ingredients so we can adjust quantities without affecting the original menu template
      const ingredients = menu.ingredients.map(ing => {
        const food = this.foods.find(f => f.id === ing.foodId);
        return { ...ing, food };
      });

      return { ...menu, id, ingredients };
    }).filter(m => m !== null) as any;
  }

  calculatePlanTotals() {
    let kcal = 0, protein = 0, carb = 0, fat = 0;
    this.plannedMenus.forEach(menu => {
      menu.ingredients.forEach((item: any) => {
        if (item.food) {
          const factor = item.quantity / item.food.servingSize;
          kcal += item.food.kcal * factor;
          protein += item.food.protein * factor;
          carb += item.food.carb * factor;
          fat += item.food.fat * factor;
        }
      });
    });
    return { kcal, protein, carb, fat };
  }
}
