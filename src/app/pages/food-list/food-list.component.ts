import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FoodInfoComponent } from '../../dialogs/food-info/food-info.component';
import { ConfirmService } from '../../shared/components/confirm-dialog.component';
import { MacroChipsComponent } from '../../shared/components/macro-chips.component';
import {
  EmptyStateComponent,
  SkeletonComponent,
} from '../../shared/components/primitives';
import { SheetService } from '../../shared/components/sheet.service';
import { SwipeRowComponent } from '../../shared/components/swipe-row.component';
import { UndoService } from '../../shared/components/undo.service';
import { Food } from '../../shared/interface/food.interface';
import { KcalPipe, MacroPipe } from '../../shared/pipes/format.pipes';
import { FoodService } from '../../shared/services/food.service';
import { MenuPlanStore } from '../../stores/menu-plan.store';

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

@Component({
  selector: 'app-food-list',
  standalone: true,
  imports: [
    MacroChipsComponent,
    MatIconModule,
    SwipeRowComponent,
    EmptyStateComponent,
    SkeletonComponent,
    KcalPipe,
    MacroPipe,
  ],
  template: `
    <div class="search">
      <mat-icon>search</mat-icon>
      <input
        type="text"
        placeholder="Search foods"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="search"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
      @if (query()) {
        <button
          type="button"
          class="clear"
          aria-label="Clear search"
          (click)="query.set('')"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
    <div class="count cap-text">{{ shown().length }} foods</div>

    @if (store.loading()) {
      <app-skeleton [count]="6" />
    } @else if (!shown().length) {
      <app-empty-state
        [icon]="query() ? 'search_off' : 'menu_book'"
        [title]="query() ? 'No foods found' : 'No foods yet'"
        [hint]="
          query()
            ? 'Try a different name or add it as new'
            : 'Add your first food to get started'
        "
      >
        <button type="button" class="nub-btn cta" (click)="open()">
          Add food
        </button>
      </app-empty-state>
    } @else {
      <div class="list">
        @for (f of shown(); track f.id) {
          <app-swipe-row [confirm]="true" (delete)="remove(f)">
            <button type="button" class="item nub-row-btn" (click)="open(f)">
              <div class="l1">
                <span class="name">{{ f.name }}</span>
                <span class="kcal num">{{ f.kcal | kcal }}</span>
              </div>
              <div class="l2 num">
                <span class="amt">per {{ f.servingSize }} {{ f.unit }}</span>
                <app-macro-chips
                  [protein]="f.protein"
                  [carb]="f.carb"
                  [fat]="f.fat"
                  [decimals]="1"
                />
              </div>
            </button>
          </app-swipe-row>
        }
      </div>
    }

    <button type="button" class="nub-fab" (click)="open()">
      <mat-icon>add</mat-icon>
      Food
    </button>
  `,
  styles: `
    .search {
      position: sticky;
      top: calc(var(--space-sm) * -1);
      z-index: 2;
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      background: var(--c-gray-100);
      border-radius: var(--radius-md);
      padding: 0 var(--space-xs) 0 var(--space-md);
      height: 44px;
      margin-top: var(--space-xs);
    }
    .search mat-icon {
      color: var(--c-gray-600);
      flex: none;
    }
    .search input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      height: 100%;
    }
    .clear {
      width: 40px;
      height: 40px;
      border: 0;
      background: transparent;
      color: var(--c-gray-600);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .count {
      padding: var(--space-sm) var(--space-xs);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }
    .item {
      flex-direction: column;
      gap: 2px;
      padding: var(--space-md);
      border: var(--border);
      border-radius: var(--radius-md);
      min-height: 56px;
    }
    .l1 {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-sm);
    }
    .name {
      font-size: var(--fs-body);
      font-weight: 500;
      color: var(--c-black);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .kcal {
      font-size: var(--fs-body);
      font-weight: 500;
    }
    .l2 {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      flex-wrap: wrap;
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
    }
    .cta {
      width: auto;
      padding: 0 var(--space-xl);
    }
  `,
})
export class FoodListComponent implements OnInit {
  private sheets = inject(SheetService);
  private confirm = inject(ConfirmService);
  private undo = inject(UndoService);
  private foods = inject(FoodService);
  store = inject(MenuPlanStore);

  query = signal('');
  shown = computed(() => {
    const q = norm(this.query().trim());
    const all = [...this.store.foods()].sort((a, b) =>
      a.name.localeCompare(b.name, 'th')
    );
    return q ? all.filter(f => norm(f.name).includes(q)) : all;
  });

  ngOnInit() {
    this.store.start();
  }

  open(food?: Food) {
    this.sheets.open(FoodInfoComponent, { food });
  }

  async remove(food: Food) {
    const ok = await this.confirm.ask({
      title: `Delete "${food.name}"?`,
      message: 'Menus that use this food will skip it.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await this.foods.deleteFood(food.id);
      this.undo.notify(`${food.name} deleted`);
    } catch {
      this.undo.notify('Could not delete. Please try again.');
    }
  }
}
