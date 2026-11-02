import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Food } from '../interface/food.interface';
import { ChipsComponent } from './primitives';

export type FoodData = Omit<Food, 'id'>;

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

/**
 * Fields for one food (name, amount, unit, macros, kcal). The host owns the
 * Save button and calls `submit()`. Macros are optional (blank = 0) and kcal
 * fills itself from them until the user types a kcal value.
 */
@Component({
  selector: 'app-food-form',
  standalone: true,
  imports: [ChipsComponent],
  template: `
    <div class="form">
      <label class="nub-field">
        <span>Name</span>
        <input
          #nameEl
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
            (focus)="$any($event.target).select()"
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
            #proteinEl
            class="nub-input num"
            type="text"
            inputmode="decimal"
            enterkeyhint="next"
            [value]="protein() ?? ''"
            (input)="macro(protein, $any($event.target).value)"
          />
        </label>
        <label class="nub-field">
          <span>Carbs (g)</span>
          <input
            class="nub-input num"
            type="text"
            inputmode="decimal"
            enterkeyhint="next"
            [value]="carb() ?? ''"
            (input)="macro(carb, $any($event.target).value)"
          />
        </label>
        <label class="nub-field">
          <span>Fat (g)</span>
          <input
            class="nub-input num"
            type="text"
            inputmode="decimal"
            enterkeyhint="next"
            [value]="fat() ?? ''"
            (input)="macro(fat, $any($event.target).value)"
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
          [class.invalid]="show() && kcal() === null"
          [value]="kcal() ?? ''"
          (input)="onKcal($any($event.target).value)"
        />
        @if (mismatch()) {
          <span class="hint"
            >From macros: {{ fromMacros() }} kcal
            <button type="button" class="use" (click)="useMacros()">
              Use
            </button></span
          >
        }
      </label>
    </div>
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
export class FoodFormComponent implements AfterViewInit {
  food = input<Food | null>(null);
  initialName = input('');
  /** Focus the first empty field once the sheet has settled. */
  autofocus = input(false);

  allUnits = ALL_UNITS;
  private nameEl = viewChild<ElementRef<HTMLInputElement>>('nameEl');
  private proteinEl = viewChild<ElementRef<HTMLInputElement>>('proteinEl');

  name = signal('');
  serving = signal(100);
  unit = signal('g');
  protein = signal<number | null>(null);
  carb = signal<number | null>(null);
  fat = signal<number | null>(null);
  kcal = signal<number | null>(null);
  show = signal(false);
  private kcalTyped = false;

  unitOptions = [...MAIN_UNITS.map(u => ({ value: u, label: u }))];
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

  ngOnInit() {
    const f = this.food();
    if (f) {
      this.name.set(f.name);
      this.serving.set(f.servingSize);
      this.unit.set(f.unit);
      this.protein.set(f.protein);
      this.carb.set(f.carb);
      this.fat.set(f.fat);
      this.kcal.set(f.kcal);
      this.kcalTyped = true;
      if (!MAIN_UNITS.includes(f.unit)) {
        this.unitOptions = [
          ...this.unitOptions,
          { value: f.unit, label: f.unit },
        ];
      }
    } else {
      this.name.set(this.initialName());
    }
  }

  ngAfterViewInit() {
    if (this.autofocus()) setTimeout(() => this.focusFirstEmpty(), 200);
  }

  /** Clear everything for the next food (keeps the unit). */
  reset() {
    this.name.set('');
    this.serving.set(100);
    this.protein.set(null);
    this.carb.set(null);
    this.fat.set(null);
    this.kcal.set(null);
    this.kcalTyped = false;
    this.show.set(false);
    this.nameEl()?.nativeElement.focus();
  }

  /** Validates and returns the data, or null (and shows errors). */
  submit(): FoodData | null {
    this.show.set(true);
    if (!this.nameOk() || !(this.serving() > 0) || this.kcal() === null) {
      this.nameEl()?.nativeElement.focus();
      return null;
    }
    return {
      name: this.name().trim(),
      servingSize: this.serving(),
      unit: this.unit(),
      protein: this.protein() ?? 0,
      carb: this.carb() ?? 0,
      fat: this.fat() ?? 0,
      kcal: this.kcal()!,
    };
  }

  num(s: { set(v: number): void }, raw: string) {
    const n = parseFloat(raw.replace(',', '.'));
    s.set(isNaN(n) ? 0 : n);
  }

  macro(s: { set(v: number | null): void }, raw: string) {
    const n = parseFloat(raw.replace(',', '.'));
    s.set(isNaN(n) || n < 0 ? null : n);
    if (!this.kcalTyped) {
      const m = this.fromMacros();
      this.kcal.set(m > 0 ? m : null);
    }
  }

  onKcal(raw: string) {
    const n = parseFloat(raw.replace(',', '.'));
    this.kcal.set(isNaN(n) || n < 0 ? null : n);
    this.kcalTyped = raw.trim() !== '';
  }

  useMacros() {
    this.kcal.set(this.fromMacros());
    this.kcalTyped = false;
  }

  private focusFirstEmpty() {
    const el = this.name().trim() ? this.proteinEl() : this.nameEl();
    el?.nativeElement.focus();
  }
}
