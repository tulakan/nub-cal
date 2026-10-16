import {
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Food } from '../interface/food.interface';
import { EmptyStateComponent } from './primitives';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

@Component({
  selector: 'app-food-picker',
  standalone: true,
  imports: [MatIconModule, EmptyStateComponent, NgTemplateOutlet],
  template: `
    <div class="search">
      <mat-icon>search</mat-icon>
      <input
        #q
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
          (click)="query.set(''); q.focus()"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>

    @if (!query() && recent().length) {
      <div class="cap">Recent</div>
      @for (f of recent(); track f.id) {
        <ng-container
          [ngTemplateOutlet]="row"
          [ngTemplateOutletContext]="{ $implicit: f }"
        />
      }
      <div class="cap">All foods</div>
    }

    @for (f of shown(); track f.id) {
      <ng-container
        [ngTemplateOutlet]="row"
        [ngTemplateOutletContext]="{ $implicit: f }"
      />
    }

    @if (more() > 0) {
      <div class="more">{{ more() }} more — keep typing to narrow</div>
    }
    @if (!shown().length) {
      <app-empty-state
        icon="search_off"
        [title]="query() ? 'No foods found' : 'No foods yet'"
        [hint]="query() ? 'Try a different name' : 'Add foods in the Foods tab'"
      />
    }

    <ng-template #row let-f>
      <button type="button" class="row" (click)="pick.emit(f)">
        <span class="name">{{ f.name }}</span>
        <span class="meta num">
          {{ f.kcal }} kcal / {{ f.servingSize }} {{ f.unit }}
        </span>
      </button>
    </ng-template>
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
      padding: 0 var(--space-xs) 0 var(--space-md);
      height: 44px;
      margin-bottom: var(--space-sm);
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
      color: var(--c-black);
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
    .cap {
      font-size: var(--fs-caption);
      text-transform: uppercase;
      color: var(--c-gray-600);
      padding: var(--space-sm) 0 var(--space-xs);
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
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
    }
    .more {
      text-align: center;
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
      padding: var(--space-md);
    }
  `,
})
export class FoodPickerComponent implements AfterViewInit {
  foods = input<Food[]>([]);
  recent = input<Food[]>([]);
  autofocus = input(true);
  pick = output<Food>();

  query = signal('');
  private input = viewChild<ElementRef<HTMLInputElement>>('q');
  private readonly LIMIT = 80;

  private matches = computed(() => {
    const q = norm(this.query().trim());
    const all = [...this.foods()].sort((a, b) =>
      a.name.localeCompare(b.name, 'th')
    );
    return q ? all.filter(f => norm(f.name).includes(q)) : all;
  });
  shown = computed(() => this.matches().slice(0, this.LIMIT));
  more = computed(() => Math.max(0, this.matches().length - this.LIMIT));

  ngAfterViewInit() {
    if (this.autofocus()) setTimeout(() => this.input()?.nativeElement.focus(), 150);
  }
}
