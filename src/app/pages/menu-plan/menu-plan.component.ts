import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SelectMenuDialogComponent } from '../../dialogs/select-menu-dialog/select-menu-dialog.component';
import { Food } from '../../shared/interface/food.interface';
import { Menu, MenuIngredient } from '../../shared/interface/menu.interface';
import { MaterialModule } from '../../shared/modules/material.module';
import { FoodService } from '../../shared/services/food.service';
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { MenuService } from '../../shared/services/menu.service';

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
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);

  activeTab: 'menus' | 'today' = 'today';

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
  plannedMenus: (Menu & {
    id: string;
    ingredients: (MenuIngredient & {
      food?: Food;
      swipeOffset?: number;
      touchStartX?: number;
    })[];
  })[] = [];

  startY = 0;
  pullDistance = 0;
  isRefreshing = false;
  itemTouchStartX = 0;

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
      this.filteredMenus = this.menus.filter(menu =>
        menu.name.toLowerCase().includes(query)
      );
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
    this.plannedMenus = this.selectedMenuIds
      .map(id => {
        const menu = this.menus.find(m => m.id === id);
        if (!menu) return null;

        // Deep copy ingredients so we can adjust quantities without affecting the original menu template
        const ingredients = menu.ingredients.map(ing => {
          const food = this.foods.find(f => f.id === ing.foodId);
          return { ...ing, food };
        });

        return { ...menu, id, ingredients };
      })
      .filter(m => m !== null) as any;
  }

  deleteMenu(id: string | undefined) {
    if (!id) return;
    const menu = this.menus.find(m => m.id === id);
    if (!menu) return;
    this.menuService.deleteMenu(id);
    this.snackBar.open(`Menu "${menu.name}" deleted`, '', { duration: 2000 });
  }

  openCreateMenuDialog() {
    this.router.navigate(['/menu-create']);
  }

  openAddMenuDialog() {
    const dialogRef = this.dialog.open(SelectMenuDialogComponent, {
      data: { menus: this.menus },
      width: '90%',
      maxWidth: '380px',
    });

    dialogRef.afterClosed().subscribe((menu: Menu) => {
      if (menu?.id) {
        this.selectedMenuIds.push(menu.id);
        this.onMenuSelectChange();
      }
    });
  }

  onQuantityChange(menuIdx: number, itemIdx: number, event: any) {
    const value = parseFloat(event.target.value);
    if (isNaN(value) || value <= 0) return;
    this.plannedMenus[menuIdx].ingredients[itemIdx].quantity = value;
  }

  calculateItemMacros(item: any) {
    if (!item.food) return { kcal: 0, protein: 0, carb: 0, fat: 0 };
    const factor = item.quantity / item.food.servingSize;
    return {
      kcal: item.food.kcal * factor,
      protein: item.food.protein * factor,
      carb: item.food.carb * factor,
      fat: item.food.fat * factor,
    };
  }

  openEditMenuDialog(menu: any) {
    this.router.navigate(['/menu-edit', menu.id]);
  }

  calculatePlanTotals() {
    let kcal = 0,
      protein = 0,
      carb = 0,
      fat = 0;
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

  // Delete food item from menu
  removeFood(menuIdx: number, itemIdx: number) {
    if (menuIdx >= 0 && menuIdx < this.plannedMenus.length) {
      const menu = this.plannedMenus[menuIdx];
      if (itemIdx >= 0 && itemIdx < menu.ingredients.length) {
        menu.ingredients.splice(itemIdx, 1);

        // If menu has no ingredients, remove the entire menu
        if (menu.ingredients.length === 0) {
          this.removeMenu(menuIdx);
        } else {
          this.calculatePlanTotals();
        }

        this.snackBar
          .open('Food item removed', 'Undo', { duration: 3000 })
          .onAction()
          .subscribe(() => {
            this.onMenuSelectChange();
          });
      }
    }
  }

  // Delete entire menu from plan
  removeMenu(menuIdx: number) {
    if (menuIdx >= 0 && menuIdx < this.plannedMenus.length) {
      const menuName = this.plannedMenus[menuIdx].name;
      this.plannedMenus.splice(menuIdx, 1);

      // Update selectedMenuIds
      if (this.plannedMenus[menuIdx]) {
        const menuId = this.plannedMenus[menuIdx].id;
        const idxInSelected = this.selectedMenuIds.indexOf(menuId);
        if (idxInSelected >= 0) {
          this.selectedMenuIds.splice(idxInSelected, 1);
        }
      }

      this.calculatePlanTotals();
      this.snackBar.open(`Menu "${menuName}" removed`, '', { duration: 2000 });
    }
  }

  // Swipe handlers for food items
  onItemTouchStart(e: TouchEvent, menuIdx: number, itemIdx: number) {
    this.itemTouchStartX = e.touches[0].clientX;
    if (!this.plannedMenus[menuIdx].ingredients[itemIdx]) {
      this.plannedMenus[menuIdx].ingredients[itemIdx] = {} as any;
    }
    this.plannedMenus[menuIdx].ingredients[itemIdx].touchStartX =
      this.itemTouchStartX;
  }

  onItemTouchMove(e: TouchEvent, menuIdx: number, itemIdx: number) {
    if (this.itemTouchStartX === 0) return;

    const currentX = e.touches[0].clientX;
    const diff = this.itemTouchStartX - currentX; // Negative = swiped left

    if (Math.abs(diff) > 10) {
      const maxSwipe = 60;
      const offset = Math.max(-maxSwipe, Math.min(0, diff));
      this.plannedMenus[menuIdx].ingredients[itemIdx].swipeOffset = offset;
    }
  }

  onItemTouchEnd(menuIdx: number, itemIdx: number) {
    const swipeOffset =
      this.plannedMenus[menuIdx].ingredients[itemIdx].swipeOffset || 0;

    // If swiped more than 40px, delete the item
    if (swipeOffset < -40) {
      this.removeFood(menuIdx, itemIdx);
    } else {
      // Reset swipe animation
      this.plannedMenus[menuIdx].ingredients[itemIdx].swipeOffset = 0;
    }

    this.itemTouchStartX = 0;
  }
}
