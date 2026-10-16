import { Component, computed, inject, signal } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { ConfirmService } from '../../shared/components/confirm-dialog.component';
import { ChipsComponent } from '../../shared/components/primitives';
import { SheetComponent } from '../../shared/components/sheet.component';
import { UndoService } from '../../shared/components/undo.service';
import { Food } from '../../shared/interface/food.interface';
import { FoodService } from '../../shared/services/food.service';

const MAIN_UNITS = ['g', 'ml', 'piece', 'serving'];
const ALL_UNITS = [
  'g',
  'kg',
  'oz',
  'lb',
  'ml',
  'l',
  'cup',
  'tbsp',
  'tsp',
  'piece',
  'slice',
  'serving',
];

/** Add / edit a food. Saves itself and dismisses. */
@Component({
  selector: 'app-food-info',
  standalone: true,
  imports: [SheetComponent, ChipsComponent],
  template: `
    <app-sheet [title]="food ? 'Edit food' : 'New food'">
      <div class="form">
        <label class="nub-field">
          <span>Name</span>
          <input
            class="nub-input"
            type="text"
            autocomplete="off"
            enterkeyhint="next"
            [class.invalid]="show() && !nameOk()"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
          />
          @if (show() && !nameOk()) {
            <span class="nub-error">Required</span>
          }
        </label>

        <div class="row">
          <label class="nub-field">
            <span>Amount</span>
            <input
              class="nub-input num"
              type="text"
              inputmode="decimal"
              enterkeyhint="next"
              [class.invalid]="show() && !(serving() > 0)"
              [value]="serving()"
              (input)="num(serving, $any($event.target).value)"
            />
          </label>
          <div class="nub-field">
            <span>Unit</span>
            <app-chips
              [options]="unitOptions"
              [value]="unit()"
              (valueChange)="unit.set($event)"
            />
            @if (moreUnits()) {
              <select
                class="nub-input"
                [value]="unit()"
                (change)="unit.set($any($event.target).value)"
              >
                @for (u of allUnits; track u) {
                  <option [value]="u" [selected]="u === unit()">{{ u }}</option>
                }
              </select>
            }
          </div>
        </div>

        <div class="cap-text">Per amount</div>
        <div class="row3">
          <label class="nub-field">
            <span>Protein (g)</span>
            <input
              class="nub-input num"
              type="text"
              inputmode="decimal"
              enterkeyhint="next"
              [class.invalid]="show() && protein() === null"
              [value]="protein() ?? ''"
              (input)="numN(protein, $any($event.target).value)"
            />
          </label>
          <label class="nub-field">
            <span>Carbs (g)</span>
            <input
              class="nub-input num"
              type="text"
              inputmode="decimal"
              enterkeyhint="next"
              [class.invalid]="show() && carb() === null"
              [value]="carb() ?? ''"
              (input)="numN(carb, $any($event.target).value)"
            />
          </label>
          <label class="nub-field">
            <span>Fat (g)</span>
            <input
              class="nub-input num"
              type="text"
              inputmode="decimal"
              enterkeyhint="next"
              [class.invalid]="show() && fat() === null"
              [value]="fat() ?? ''"
              (input)="numN(fat, $any($event.target).value)"
            />
          </label>
        </div>

        <label class="nub-field">
          <span>Calories (kcal)</span>
          <input
            class="nub-input num"
            type="text"
            inputmode="decimal"
            enterkeyhint="done"
            [placeholder]="fromMacros() ? '' + fromMacros() : ''"
            [class.invalid]="show() && kcal() === null"
            [value]="kcal() ?? ''"
            (input)="numN(kcal, $any($event.target).value)"
          />
          @if (mismatch()) {
            <span class="hint"
              >From macros: {{ fromMacros() }} kcal
              <button
                type="button"
                class="use"
                (click)="kcal.set(fromMacros())"
              >
                Use
              </button></span
            >
          }
        </label>

        @if (food) {
          <button type="button" class="nub-btn text danger" (click)="remove()">
            Delete food
          </button>
        }
      </div>
      <div sheetFooter>
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
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }
    .row {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: var(--space-md);
      align-items: start;
    }
    .row3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-sm);
      margin-top: calc(var(--space-sm) * -1);
    }
    .hint {
      font-size: var(--fs-body-sm);
      color: var(--c-warning-text);
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    .use {
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 500;
      color: var(--c-black);
      text-decoration: underline;
      min-height: 32px;
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
  allUnits = ALL_UNITS;

  name = signal(this.food?.name ?? '');
  serving = signal(this.food?.servingSize ?? 100);
  unit = signal(this.food?.unit ?? 'g');
  protein = signal<number | null>(this.food?.protein ?? null);
  carb = signal<number | null>(this.food?.carb ?? null);
  fat = signal<number | null>(this.food?.fat ?? null);
  kcal = signal<number | null>(this.food?.kcal ?? null);
  show = signal(false);
  saving = signal(false);

  unitOptions = [
    ...MAIN_UNITS.map(u => ({ value: u, label: u })),
    ...(MAIN_UNITS.includes(this.unit())
      ? []
      : [{ value: this.unit(), label: this.unit() }]),
  ];
  moreUnits = computed(() => !MAIN_UNITS.includes(this.unit()));

  nameOk = computed(() => this.name().trim().length >= 2);
  fromMacros = computed(() =>
    Math.round(
      (this.protein() ?? 0) * 4 + (this.carb() ?? 0) * 4 + (this.fat() ?? 0) * 9
    )
  );
  mismatch = computed(() => {
    const k = this.kcal();
    const m = this.fromMacros();
    return k !== null && m > 0 && Math.abs(m - k) / Math.max(k, 1) > 0.05;
  });

  num(s: { set(v: number): void }, raw: string) {
    const n = parseFloat(raw.replace(',', '.'));
    s.set(isNaN(n) ? 0 : n);
  }
  numN(s: { set(v: number | null): void }, raw: string) {
    const n = parseFloat(raw.replace(',', '.'));
    s.set(isNaN(n) || n < 0 ? null : n);
  }

  async save() {
    this.show.set(true);
    const ok =
      this.nameOk() &&
      this.serving() > 0 &&
      this.protein() !== null &&
      this.carb() !== null &&
      this.fat() !== null &&
      this.kcal() !== null;
    if (!ok) return;
    const data = {
      name: this.name().trim(),
      servingSize: this.serving(),
      unit: this.unit(),
      protein: this.protein()!,
      carb: this.carb()!,
      fat: this.fat()!,
      kcal: this.kcal()!,
    };
    this.saving.set(true);
    try {
      if (this.food) await this.foods.updateFood(this.food.id, data);
      else await this.foods.addFood(data);
      this.undo.notify(`${this.food ? 'Updated' : 'Added'} ${data.name}`);
      this.ref.dismiss(true);
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
