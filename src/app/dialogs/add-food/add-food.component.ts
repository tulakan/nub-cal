import { Component, computed, inject, signal } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FoodLogStore } from '../../stores/food-log.store';
import { MenuPlanStore } from '../../stores/menu-plan.store';
import { FoodPickerComponent } from '../../shared/components/food-picker.component';
import { MacroSummaryComponent } from '../../shared/components/macro-summary.component';
import { MenuPickerComponent } from '../../shared/components/menu-picker.component';
import { QtyInputComponent } from '../../shared/components/qty-input.component';
import { SheetComponent } from '../../shared/components/sheet.component';
import {
  ChipsComponent,
  SegmentedComponent,
} from '../../shared/components/primitives';
import { UndoService } from '../../shared/components/undo.service';
import { Food } from '../../shared/interface/food.interface';
import { Menu } from '../../shared/interface/menu.interface';
import { KcalPipe, MacroPipe } from '../../shared/pipes/format.pipes';
import {
  calcNutrition,
  ingredientsNutrition,
} from '../../shared/utils/nutrition';

type Step = 'pick' | 'qty' | 'menu';

@Component({
  selector: 'app-add-food',
  standalone: true,
  imports: [
    SheetComponent,
    SegmentedComponent,
    ChipsComponent,
    FoodPickerComponent,
    MenuPickerComponent,
    QtyInputComponent,
    MacroSummaryComponent,
    KcalPipe,
    MacroPipe,
  ],
  templateUrl: './add-food.component.html',
  styleUrls: ['./add-food.component.scss'],
})
export class AddFoodComponent {
  private ref = inject(MatBottomSheetRef<AddFoodComponent>);
  private undo = inject(UndoService);
  log = inject(FoodLogStore);
  store = inject(MenuPlanStore);

  tabs = [
    { value: 'foods', label: 'Foods' },
    { value: 'menus', label: 'Menus' },
  ];
  scaleOptions = ['0.5', '1', '1.5', '2'].map(v => ({
    value: v,
    label: v === '0.5' ? '½×' : v === '1.5' ? '1½×' : `${v}×`,
  }));

  step = signal<Step>('pick');
  tab = signal('foods');
  food = signal<Food | null>(null);
  qty = signal(0);

  menu = signal<Menu | null>(null);
  menuScale = signal(1);
  menuQty = signal<{ foodId: string; quantity: number }[]>([]);

  recent = this.log.recentFoods(8);

  title = computed(() => {
    if (this.step() === 'qty') return this.food()?.name ?? 'Add food';
    if (this.step() === 'menu') return this.menu()?.name ?? 'Add menu';
    return 'Add to today';
  });

  nutrition = computed(() => calcNutrition(this.food(), this.qty()));
  menuNutrition = computed(() =>
    ingredientsNutrition(this.menuQty(), this.store.foodsById())
  );

  quickChips = computed(() => {
    const f = this.food();
    if (!f) return [];
    return [0.5, 1, 1.5, 2].map(m => {
      const v = Math.round(f.servingSize * m * 100) / 100;
      return { value: String(v), label: `${v}` };
    });
  });

  constructor() {
    this.store.start();
  }

  selectFood(f: Food) {
    this.food.set(f);
    this.qty.set(f.servingSize);
    this.step.set('qty');
  }

  selectMenu(m: Menu) {
    this.menu.set(m);
    this.menuScale.set(1);
    this.menuQty.set(m.ingredients.map(i => ({ ...i })));
    this.step.set('menu');
  }

  setMenuScale(v: string) {
    const scale = Number(v);
    const m = this.menu();
    if (!m) return;
    this.menuScale.set(scale);
    this.menuQty.set(
      m.ingredients.map(i => ({
        foodId: i.foodId,
        quantity: Math.round(i.quantity * scale * 100) / 100,
      }))
    );
  }

  setIngredientQty(index: number, quantity: number) {
    this.menuQty.update(list =>
      list.map((i, idx) => (idx === index ? { ...i, quantity } : i))
    );
  }

  foodOf(foodId: string): Food | undefined {
    return this.store.foodsById().get(foodId);
  }

  back() {
    this.step.set('pick');
  }

  addFood() {
    const f = this.food();
    if (!f || !(this.qty() > 0)) return;
    const id = this.log.addFood(f, this.qty());
    this.undo.undoable(`Added ${f.name}`, () => {
      this.log.remove([id]);
    });
    this.ref.dismiss();
  }

  addMenu() {
    const m = this.menu();
    if (!m?.id) return;
    const { ids, skipped } = this.log.logMenu(
      { menuId: m.id, name: m.name, ingredients: this.menuQty() },
      this.store.foodsById()
    );
    if (!ids.length) {
      this.undo.notify('Nothing logged: foods in this menu were deleted');
    } else {
      const note = skipped ? ` (${skipped} skipped, food deleted)` : '';
      this.undo.undoable(`Logged ${m.name}${note}`, () => {
        this.log.remove(ids);
      });
    }
    this.ref.dismiss();
  }
}
