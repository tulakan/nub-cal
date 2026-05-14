import { Component, OnInit, inject } from '@angular/core';
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/modules/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CreateMenuComponent } from '../../dialogs/create-menu/create-menu.component';
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
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);

  targetMacros = {
    kcal: 2000,
    protein: 150,
    carb: 250,
    fat: 67,
  };

  foods: Food[] = [];
  menus: Menu[] = [];
  filteredMenus: Menu[] = [];
  menuSearchQuery = '';

  // For Planning
  selectedMenuIds: string[] = [];
  plannedMenus: (Menu & { id: string; ingredients: (MenuIngredient & { food?: Food })[] })[] = [];

  startY = 0;
  pullDistance = 0;
  isRefreshing = false;

  ngOnInit() {
    this.loadFoods();
    this.loadMenus();
    
    const savedTargets = localStorage.getItem('food-log-target-macros');
    if (savedTargets) {
      this.targetMacros = JSON.parse(savedTargets);
    }
  }

  onTouchStart(e: TouchEvent) {
    if (window.scrollY === 0) {
      this.startY = e.touches[0].clientY;
    }
  }

  onTouchMove(e: TouchEvent) {
    if (this.startY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - this.startY;
    if (diff > 0 && window.scrollY === 0) {
      this.pullDistance = Math.min(diff * 0.5, 80);
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }

  onTouchEnd() {
    if (this.pullDistance > 50) {
      this.refreshData();
    }
    this.startY = 0;
    this.pullDistance = 0;
  }

  refreshData() {
    this.isRefreshing = true;
    this.loadMenus();
    this.loadFoods();
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }

  loadFoods() {
    this.foodService.getFoodListRealtime(foods => {
      this.foods = foods;
    });
  }

  loadMenus() {
    this.menuService.getMenuListRealtime(menus => {
      this.menus = menus;
      this.filterMenus();
    });
  }

  onMenuSearch(event: any) {
    this.menuSearchQuery = event.target.value;
    this.filterMenus();
  }

  filterMenus() {
    if (!this.menuSearchQuery) {
      this.filteredMenus = this.menus;
    } else {
      const query = this.menuSearchQuery.toLowerCase();
      this.filteredMenus = this.menus.filter(menu => menu.name.toLowerCase().includes(query));
    }
  }

  displayEmpty(value: any): string {
    return '';
  }
  onMenuSelected(event: any) {
    const menuId = event.option.value;
    if (!this.selectedMenuIds.includes(menuId)) {
      this.selectedMenuIds.push(menuId);
      this.onMenuSelectChange();
    }
    this.menuSearchQuery = '';
    this.filterMenus();
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

  openCreateMenuDialog() {
    const dialogRef = this.dialog.open(CreateMenuComponent, {
      width: '500px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMenus(); // Reload menus if saved
      }
    });
  }

  calculateItemMacros(item: any) {
    if (!item.food) return { kcal: 0, protein: 0, carb: 0, fat: 0 };
    const factor = item.quantity / item.food.servingSize;
    return {
      kcal: item.food.kcal * factor,
      protein: item.food.protein * factor,
      carb: item.food.carb * factor,
      fat: item.food.fat * factor
    };
  }

  openEditMenuDialog(menu: any) {
    const dialogRef = this.dialog.open(CreateMenuComponent, {
      width: '500px',
      maxHeight: '90vh',
      data: { menu }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMenus(); // Reload menus if saved
      }
    });
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
