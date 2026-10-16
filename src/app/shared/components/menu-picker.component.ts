import { Component, computed, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MenuPlanStore } from '../../stores/menu-plan.store';
import { Menu } from '../interface/menu.interface';
import { KcalPipe, MacroPipe } from '../pipes/format.pipes';
import { MacroChipsComponent } from './macro-chips.component';
import { EmptyStateComponent } from './primitives';

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

@Component({
  selector: 'app-menu-picker',
  standalone: true,
  imports: [
    MacroChipsComponent,
    MatIconModule,
    KcalPipe,
    MacroPipe,
    EmptyStateComponent,
  ],
  template: `
    <div class="search">
      <mat-icon>search</mat-icon>
      <input
        type="text"
        placeholder="Search menus"
        autocomplete="off"
        enterkeyhint="search"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
    </div>
    @for (m of shown(); track m.id) {
      <button type="button" class="row" (click)="pick.emit(m)">
        <span class="name">{{ m.name }}</span>
        <span class="meta num">
          <span
            >{{ store.menuNutrition(m).kcal | kcal }} kcal ·
            {{ m.ingredients.length }} items</span
          >
          <app-macro-chips
            [protein]="store.menuNutrition(m).protein"
            [carb]="store.menuNutrition(m).carb"
            [fat]="store.menuNutrition(m).fat"
          />
        </span>
      </button>
    }
    @if (!shown().length) {
      <app-empty-state
        icon="restaurant_menu"
        [title]="query() ? 'No menus found' : 'No menus yet'"
        [hint]="
          query() ? 'Try a different name' : 'Create one from the Plan tab'
        "
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .search {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      background: var(--c-gray-100);
      border-radius: var(--radius-md);
      padding: 0 var(--space-md);
      height: 44px;
      margin-bottom: var(--space-sm);
    }
    .search mat-icon {
      color: var(--c-gray-600);
    }
    .search input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      height: 100%;
    }
    .row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      width: 100%;
      min-height: 52px;
      padding: var(--space-sm) var(--space-xs);
      border: 0;
      border-bottom: var(--border);
      background: transparent;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .name {
      font-size: var(--fs-body);
      font-weight: 500;
      color: var(--c-black);
    }
    .meta {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      flex-wrap: wrap;
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
    }
  `,
})
export class MenuPickerComponent {
  store = inject(MenuPlanStore);
  pick = output<Menu>();
  query = signal('');

  shown = computed(() => {
    const q = norm(this.query().trim());
    const all = this.store.menus();
    return q ? all.filter(m => norm(m.name).includes(q)) : all;
  });

  constructor() {
    this.store.start();
  }
}
