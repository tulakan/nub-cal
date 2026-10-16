import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FoodLogStore } from '../../stores/food-log.store';
import { MacroSummaryComponent } from '../../shared/components/macro-summary.component';
import { QtyInputComponent } from '../../shared/components/qty-input.component';
import { SheetComponent } from '../../shared/components/sheet.component';
import { UndoService } from '../../shared/components/undo.service';
import { KcalPipe, MacroPipe } from '../../shared/pipes/format.pipes';
import { calcNutrition } from '../../shared/utils/nutrition';

@Component({
  selector: 'app-edit-logged',
  standalone: true,
  imports: [SheetComponent, QtyInputComponent, MacroSummaryComponent, KcalPipe, MacroPipe],
  template: `
    <app-sheet [title]="item()?.food?.name ?? ''">
      @if (item(); as it) {
        <div class="meta">
          {{ it.food.kcal }} kcal per {{ it.food.servingSize }} {{ it.food.unit }}
        </div>
        <app-qty-input [(value)]="qty" [unit]="it.food.unit" />
        <div class="preview num">
          <span class="big">{{ nutrition().kcal | kcal }} kcal</span>
          <span>
            P {{ nutrition().protein | macro: 1 }} · C {{ nutrition().carb | macro: 1 }} · F
            {{ nutrition().fat | macro: 1 }}
          </span>
        </div>
        <app-macro-summary
          [target]="log.targets()"
          [consumed]="othersConsumed()"
          [preview]="nutrition()"
          suffix=" after this"
        />
      }
      <div sheetFooter class="foot">
        <button type="button" class="nub-btn" [disabled]="!(qty() > 0)" (click)="save()">
          Save
        </button>
        <button type="button" class="nub-btn text danger" (click)="remove()">Remove</button>
      </div>
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
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--space-md);
      background: var(--c-primary-bg);
      border-radius: var(--radius-md);
      margin: var(--space-md) 0;
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
    }
    .big {
      font-size: var(--fs-title);
      font-weight: 700;
      color: var(--c-primary-ink);
    }
    .foot {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
  `,
})
export class EditLoggedComponent {
  private ref = inject(MatBottomSheetRef<EditLoggedComponent>);
  private undo = inject(UndoService);
  private data = inject<{ id: string }>(MAT_BOTTOM_SHEET_DATA);
  log = inject(FoodLogStore);

  item = computed(() => this.log.items().find(i => i.id === this.data.id) ?? null);
  qty = signal(this.item()?.servingSize ?? 0);
  nutrition = computed(() => calcNutrition(this.item()?.food, this.qty()));

  /** Consumed excluding this item, so the preview isn't double counted. */
  othersConsumed = computed(() => {
    const c = this.log.consumed();
    const n = this.item()?.calculatedNutrition;
    if (!n) return c;
    return {
      kcal: c.kcal - n.kcal,
      protein: c.protein - n.protein,
      carb: c.carb - n.carb,
      fat: c.fat - n.fat,
    };
  });

  save() {
    if (this.qty() > 0) this.log.updateQuantity(this.data.id, this.qty());
    this.ref.dismiss();
  }

  remove() {
    const name = this.item()?.food.name ?? 'Item';
    const removed = this.log.remove([this.data.id]);
    this.undo.undoable(`${name} removed`, () => this.log.restore(removed));
    this.ref.dismiss();
  }
}
