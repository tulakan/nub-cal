import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmService } from '../../shared/components/confirm-dialog.component';
import { MacroSummaryComponent } from '../../shared/components/macro-summary.component';
import { QtyInputComponent } from '../../shared/components/qty-input.component';
import { SheetService } from '../../shared/components/sheet.service';
import { SwipeRowComponent } from '../../shared/components/swipe-row.component';
import { SkeletonComponent } from '../../shared/components/primitives';
import { UndoService } from '../../shared/components/undo.service';
import { HasUnsavedChanges } from '../../shared/guards/unsaved-changes.guard';
import { Food } from '../../shared/interface/food.interface';
import { Menu, MenuIngredient } from '../../shared/interface/menu.interface';
import { KcalPipe, MacroPipe } from '../../shared/pipes/format.pipes';
import { MenuService } from '../../shared/services/menu.service';
import { ShellService } from '../../shared/services/shell.service';
import { calcNutrition, ingredientsNutrition } from '../../shared/utils/nutrition';
import { MenuPlanStore } from '../../stores/menu-plan.store';
import { IngredientSheetComponent } from '../ingredient-sheet/ingredient-sheet.component';

@Component({
  selector: 'app-create-menu',
  standalone: true,
  imports: [
    MatIconModule,
    SwipeRowComponent,
    QtyInputComponent,
    MacroSummaryComponent,
    SkeletonComponent,
    KcalPipe,
    MacroPipe,
  ],
  template: `
    @if (!ready()) {
      <app-skeleton [count]="4" />
    } @else {
      <div class="page">
        <label class="nub-field">
          <span>Menu name</span>
          <input
            class="nub-input"
            type="text"
            placeholder="e.g. Chicken rice bowl"
            autocomplete="off"
            enterkeyhint="done"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
          />
        </label>

        <div class="sect-head">
          <div class="sect-title">Ingredients · {{ ingredients().length }}</div>
        </div>

        <div class="ings">
          @for (ing of ingredients(); track $index) {
            @let f = foodOf(ing.foodId);
            <app-swipe-row (delete)="remove($index)">
              <div class="ing" [class.missing]="!f">
                <div class="iname">
                  {{ f ? f.name : 'Deleted food' }}
                  @if (!f) {
                    <button type="button" class="rm" (click)="remove($index)">Remove</button>
                  }
                </div>
                @if (f) {
                  <app-qty-input
                    [compact]="true"
                    [value]="ing.quantity"
                    [unit]="f.unit"
                    (valueChange)="setQty($index, $event)"
                  />
                  <div class="ikcal num">{{ kcalOf(ing) | kcal }}</div>
                }
              </div>
            </app-swipe-row>
          }
          <button type="button" class="add" (click)="addIngredient()">
            <mat-icon>add</mat-icon> Add ingredient
          </button>
        </div>

        @if (editId) {
          <div class="extra">
            <button type="button" class="nub-btn text" (click)="duplicate()">Duplicate menu</button>
            <button type="button" class="nub-btn text danger" (click)="deleteMenu()">
              Delete menu
            </button>
          </div>
        }
      </div>

      <div class="totals">
        <app-macro-summary [consumed]="totals()" />
        <div class="split num">P {{ split().p }}% · C {{ split().c }}% · F {{ split().f }}%</div>
      </div>
    }
  `,
  styles: `
    .page {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      padding: var(--space-sm) var(--space-xs) 120px;
    }
    .ings {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
    .ing {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      min-height: 52px;
      padding: var(--space-xs) var(--space-md);
      border: var(--border);
      border-radius: var(--radius-md);
    }
    .iname {
      flex: 1;
      min-width: 0;
      font-size: var(--fs-body);
      font-weight: 500;
    }
    .ing.missing .iname {
      font-style: italic;
      font-weight: 400;
      color: var(--c-gray-600);
    }
    .rm {
      margin-left: var(--space-sm);
      border: 0;
      background: transparent;
      color: var(--c-negative-text);
      font: inherit;
      min-height: 44px;
    }
    .ikcal {
      width: 44px;
      text-align: right;
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
    }
    .add {
      min-height: 48px;
      border: 1px dashed var(--c-gray-400);
      border-radius: var(--radius-md);
      background: transparent;
      font: inherit;
      color: var(--c-gray-800);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-xs);
      cursor: pointer;
    }
    .extra {
      display: flex;
      flex-direction: column;
      margin-top: var(--space-lg);
    }
    .totals {
      position: fixed;
      left: var(--app-edge);
      right: var(--app-edge);
      bottom: 0;
      z-index: 4;
      padding: var(--space-md) var(--space-lg) calc(var(--space-md) + var(--safe-bottom));
      background: var(--c-white);
      border-top: var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-md);
    }
    .split {
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
      white-space: nowrap;
    }
  `,
})
export class CreateMenuComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sheets = inject(SheetService);
  private undo = inject(UndoService);
  private confirm = inject(ConfirmService);
  private menuService = inject(MenuService);
  private shell = inject(ShellService);
  store = inject(MenuPlanStore);

  editId = this.route.snapshot.paramMap.get('id');
  name = signal('');
  ingredients = signal<MenuIngredient[]>([]);
  ready = signal(!this.route.snapshot.paramMap.get('id'));

  private initial = '';
  private saved = false;

  totals = computed(() => ingredientsNutrition(this.ingredients(), this.store.foodsById()));
  split = computed(() => {
    const t = this.totals();
    const total = t.protein * 4 + t.carb * 4 + t.fat * 9 || 1;
    return {
      p: Math.round((t.protein * 4 * 100) / total),
      c: Math.round((t.carb * 4 * 100) / total),
      f: Math.round((t.fat * 9 * 100) / total),
    };
  });
  canSave = computed(() => this.name().trim().length > 0 && this.ingredients().length > 0);

  constructor() {
    effect(
      () => {
        if (!this.editId || this.ready() || !this.store.menusLoaded()) return;
        const m = this.store.menusById().get(this.editId);
        if (m) {
          this.name.set(m.name);
          this.ingredients.set(m.ingredients.map(i => ({ ...i })));
          this.initial = this.snapshot();
          this.ready.set(true);
        } else {
          this.undo.notify('Menu not found');
          this.saved = true;
          this.router.navigate(['/plan']);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.store.start();
    this.initial = this.snapshot();
    this.shell.set([
      {
        label: 'Save',
        ariaLabel: 'Save menu',
        onClick: () => this.save(),
        disabled: computed(() => !this.canSave() || !this.ready()),
      },
    ]);
  }

  ngOnDestroy() {
    this.shell.clear();
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && this.ready() && this.snapshot() !== this.initial;
  }

  private snapshot(): string {
    return JSON.stringify([this.name().trim(), this.ingredients()]);
  }

  foodOf(id: string): Food | undefined {
    return this.store.foodsById().get(id);
  }

  kcalOf(ing: MenuIngredient): number {
    return calcNutrition(this.foodOf(ing.foodId), ing.quantity).kcal;
  }

  setQty(index: number, quantity: number) {
    this.ingredients.update(l => l.map((i, idx) => (idx === index ? { ...i, quantity } : i)));
  }

  remove(index: number) {
    this.ingredients.update(l => l.filter((_, i) => i !== index));
  }

  addIngredient() {
    this.sheets
      .open<IngredientSheetComponent, MenuIngredient | undefined>(IngredientSheetComponent)
      .afterDismissed()
      .subscribe(result => {
        if (!result) return;
        const existing = this.ingredients().findIndex(i => i.foodId === result.foodId);
        if (existing >= 0) {
          const qty = this.ingredients()[existing].quantity + result.quantity;
          this.setQty(existing, Math.round(qty * 100) / 100);
          this.undo.notify(`Updated ${this.foodOf(result.foodId)?.name ?? 'ingredient'} to ${qty}`);
        } else {
          this.ingredients.update(l => [...l, result]);
        }
      });
  }

  async save() {
    if (!this.canSave()) return;
    const data: Menu = {
      name: this.name().trim(),
      ingredients: this.ingredients(),
    };
    try {
      if (this.editId) {
        await this.menuService.updateMenu(this.editId, { ...data, updatedAt: Date.now() });
      } else {
        await this.menuService.addMenu(data);
      }
      this.saved = true;
      this.undo.notify(`Saved "${data.name}"`);
      this.router.navigate(['/plan']);
    } catch (e) {
      console.error('Error saving menu:', e);
      this.undo.notify('Could not save. Please try again.');
    }
  }

  async duplicate() {
    if (!this.canSave()) return;
    await this.menuService.addMenu({
      name: `${this.name().trim()} (copy)`,
      ingredients: this.ingredients(),
    });
    this.saved = true;
    this.undo.notify('Menu duplicated');
    this.router.navigate(['/plan']);
  }

  async deleteMenu() {
    if (!this.editId) return;
    const ok = await this.confirm.ask({
      title: `Delete "${this.name()}"?`,
      message: 'This removes the saved menu. Past logs are not affected.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await this.menuService.deleteMenu(this.editId);
    this.saved = true;
    this.router.navigate(['/plan']);
  }
}
