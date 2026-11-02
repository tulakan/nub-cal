import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FoodFormComponent } from '../../shared/components/food-form.component';
import { FoodService } from '../../shared/services/food.service';
import { UndoService } from '../../shared/components/undo.service';
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
  imports: [SheetComponent, FoodPickerComponent, FoodFormComponent, QtyInputComponent, KcalPipe, MacroPipe],
  template: `
    <app-sheet
      [title]="creating() !== null ? 'New food' : (food()?.name ?? 'Add ingredient')"
      [showBack]="!!food() || creating() !== null"
      (back)="food.set(null); creating.set(null)"
    >
      @if (creating() !== null) {
        <app-food-form #form [initialName]="creating()!" [autofocus]="true" />
      } @else if (food()) {
        @let f = food()!;
        <div class="meta">{{ f.kcal }} kcal per {{ f.servingSize }} {{ f.unit }}</div>
        <app-qty-input [(value)]="qty" [unit]="f.unit" />
        <div class="preview num">
          {{ n().kcal | kcal }} kcal · P {{ n().protein | macro: 1 }} · C
          {{ n().carb | macro: 1 }} · F {{ n().fat | macro: 1 }}
        </div>
      } @else {
        <app-food-picker
          [foods]="store.foods()"
          (pick)="select($event)"
          (create)="creating.set($event)"
        />
      }
      @if (creating() !== null) {
        <div sheetFooter>
          <button type="button" class="nub-btn" [disabled]="saving()" (click)="createFood()">
            Save &amp; continue
          </button>
        </div>
      } @else if (food()) {
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
  private foods = inject(FoodService);
  private undo = inject(UndoService);
  food = signal<Food | null>(null);
  /** Search text while the new-food form is open, else null. */
  creating = signal<string | null>(null);
  saving = signal(false);
  form = viewChild<FoodFormComponent>('form');
  qty = signal(0);
  n = computed(() => calcNutrition(this.food(), this.qty()));

  constructor() {
    this.store.start();
  }

  select(f: Food) {
    this.food.set(f);
    this.qty.set(f.servingSize);
  }

  async createFood() {
    const data = this.form()?.submit();
    if (!data) return;
    this.saving.set(true);
    try {
      const f = await this.foods.createFood(data);
      this.creating.set(null);
      this.select(f);
    } catch (e) {
      console.error(e);
      this.undo.notify('Could not save. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  add() {
    const f = this.food();
    if (f && this.qty() > 0) this.ref.dismiss({ foodId: f.id, quantity: this.qty() });
  }
}
