import { Component, inject, signal, viewChild } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { ConfirmService } from '../../shared/components/confirm-dialog.component';
import { FoodFormComponent } from '../../shared/components/food-form.component';
import { SheetComponent } from '../../shared/components/sheet.component';
import { UndoService } from '../../shared/components/undo.service';
import { Food } from '../../shared/interface/food.interface';
import { FoodService } from '../../shared/services/food.service';

/** Add / edit a food. Saves itself and dismisses. */
@Component({
  selector: 'app-food-info',
  standalone: true,
  imports: [SheetComponent, FoodFormComponent],
  template: `
    <app-sheet [title]="food ? 'Edit food' : 'New food'">
      <app-food-form #form [food]="food" [autofocus]="!food" />
      @if (food) {
        <button type="button" class="nub-btn text danger del" (click)="remove()">
          Delete food
        </button>
      }
      <div sheetFooter class="foot">
        @if (!food) {
          <button
            type="button"
            class="nub-btn text"
            [disabled]="saving()"
            (click)="save(true)"
          >
            Save &amp; add another
          </button>
        }
        <button
          type="button"
          class="nub-btn"
          [disabled]="saving()"
          (click)="save()"
        >
          Save
        </button>
      </div>
    </app-sheet>
  `,
  styles: `
    .del {
      margin-top: var(--space-md);
    }
    .foot {
      display: flex;
      gap: var(--space-sm);
    }
    .foot .text {
      flex: none;
      width: auto;
      padding: 0 var(--space-md);
    }
  `,
})
export class FoodInfoComponent {
  private ref = inject(MatBottomSheetRef<FoodInfoComponent>);
  private foods = inject(FoodService);
  private undo = inject(UndoService);
  private confirm = inject(ConfirmService);
  private data = inject<{ food?: Food } | null>(MAT_BOTTOM_SHEET_DATA, {
    optional: true,
  });

  food = this.data?.food ?? null;
  form = viewChild.required<FoodFormComponent>('form');
  saving = signal(false);

  async save(another = false) {
    const data = this.form().submit();
    if (!data) return;
    this.saving.set(true);
    try {
      if (this.food) await this.foods.updateFood(this.food.id, data);
      else await this.foods.addFood(data);
      this.undo.notify(`${this.food ? 'Updated' : 'Added'} ${data.name}`);
      if (another) {
        this.form().reset();
        this.saving.set(false);
      } else {
        this.ref.dismiss(true);
      }
    } catch (e) {
      console.error(e);
      this.undo.notify('Could not save. Please try again.');
      this.saving.set(false);
    }
  }

  async remove() {
    if (!this.food) return;
    const ok = await this.confirm.ask({
      title: `Delete "${this.food.name}"?`,
      message: 'Menus that use this food will skip it.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await this.foods.deleteFood(this.food.id);
    this.undo.notify(`${this.food.name} deleted`);
    this.ref.dismiss(true);
  }
}
