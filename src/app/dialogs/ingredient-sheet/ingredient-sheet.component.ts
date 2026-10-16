import { Component, computed, inject, signal } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FoodPickerComponent } from '../../shared/components/food-picker.component';
import { QtyInputComponent } from '../../shared/components/qty-input.component';
import { SheetComponent } from '../../shared/components/sheet.component';
import { Food } from '../../shared/interface/food.interface';
import { KcalPipe, MacroPipe } from '../../shared/pipes/format.pipes';
import { calcNutrition } from '../../shared/utils/nutrition';
import { MenuPlanStore } from '../../stores/menu-plan.store';

/** Pick a food, set a quantity, dismiss with { foodId, quantity }. */
@Component({
  selector: 'app-ingredient-sheet',
  standalone: true,
  imports: [SheetComponent, FoodPickerComponent, QtyInputComponent, KcalPipe, MacroPipe],
  template: `
    <app-sheet
      [title]="food()?.name ?? 'Add ingredient'"
      [showBack]="!!food()"
      (back)="food.set(null)"
    >
      @if (food(); as f) {
        <div class="meta">{{ f.kcal }} kcal per {{ f.servingSize }} {{ f.unit }}</div>
        <app-qty-input [(value)]="qty" [unit]="f.unit" />
        <div class="preview num">
          {{ n().kcal | kcal }} kcal · P {{ n().protein | macro: 1 }} · C
          {{ n().carb | macro: 1 }} · F {{ n().fat | macro: 1 }}
        </div>
      } @else {
        <app-food-picker [foods]="store.foods()" (pick)="select($event)" />
      }
      @if (food()) {
        <div sheetFooter>
          <button type="button" class="nub-btn" [disabled]="!(qty() > 0)" (click)="add()">
            Add ingredient
          </button>
        </div>
      }
    </app-sheet>
  `,
  styles: `
    .meta {
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
      text-align: center;
      margin-bottom: var(--space-md);
    }
    .preview {
      margin-top: var(--space-lg);
      text-align: center;
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
    }
  `,
})
export class IngredientSheetComponent {
  private ref = inject(MatBottomSheetRef<IngredientSheetComponent>);
  store = inject(MenuPlanStore);
  food = signal<Food | null>(null);
  qty = signal(0);
  n = computed(() => calcNutrition(this.food(), this.qty()));

  constructor() {
    this.store.start();
  }

  select(f: Food) {
    this.food.set(f);
    this.qty.set(f.servingSize);
  }

  add() {
    const f = this.food();
    if (f && this.qty() > 0) this.ref.dismiss({ foodId: f.id, quantity: this.qty() });
  }
}
