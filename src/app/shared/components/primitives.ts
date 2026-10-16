import { Component, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty">
      <mat-icon>{{ icon() }}</mat-icon>
      <div class="t">{{ title() }}</div>
      @if (hint()) {
        <div class="h">{{ hint() }}</div>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-xs);
      padding: var(--space-xl) var(--space-lg);
    }
    mat-icon {
      width: 64px;
      height: 64px;
      font-size: 32px;
      line-height: 64px;
      text-align: center;
      border-radius: 50%;
      background: var(--c-primary-bg);
      color: var(--c-primary-ink);
      margin-bottom: var(--space-sm);
    }
    .t {
      font-size: var(--fs-body);
      font-weight: 500;
      color: var(--c-black);
    }
    .h {
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
    }
    :host ::ng-deep button {
      margin-top: var(--space-sm);
    }
  `,
})
export class EmptyStateComponent {
  icon = input('restaurant');
  title = input('');
  hint = input('');
}

export interface SegmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-segmented',
  standalone: true,
  template: `
    <div class="seg" role="tablist">
      @for (o of options(); track o.value) {
        <button
          type="button"
          role="tab"
          class="opt"
          [class.on]="o.value === value()"
          [attr.aria-selected]="o.value === value()"
          (click)="value.set(o.value)"
        >
          {{ o.label }}
        </button>
      }
    </div>
  `,
  styles: `
    .seg {
      display: flex;
      background: var(--c-gray-100);
      border-radius: var(--radius-md);
      padding: 2px;
    }
    .opt {
      flex: 1;
      min-height: 36px;
      border: 0;
      background: transparent;
      border-radius: 6px;
      font: inherit;
      font-size: var(--fs-body);
      color: var(--c-gray-600);
      cursor: pointer;
    }
    .opt.on {
      background: var(--c-primary-bg);
      color: var(--c-primary-ink);
      font-weight: 700;
    }
  `,
})
export class SegmentedComponent {
  options = input.required<SegmentOption[]>();
  value = model<string>('');
}

@Component({
  selector: 'app-chips',
  standalone: true,
  template: `
    <div class="chips" role="group">
      @for (o of options(); track o.value) {
        <button
          type="button"
          class="chip"
          [class.on]="o.value === value()"
          [attr.aria-pressed]="o.value === value()"
          (click)="value.set(o.value)"
        >
          {{ o.label }}
        </button>
      }
    </div>
  `,
  styles: `
    .chips {
      display: flex;
      gap: var(--space-sm);
      overflow-x: auto;
      scrollbar-width: none;
      padding: 2px 0;
    }
    .chips::-webkit-scrollbar {
      display: none;
    }
    .chip {
      flex: none;
      min-height: 32px;
      padding: 0 var(--space-md);
      border: var(--border);
      background: var(--c-white);
      border-radius: 16px;
      font: inherit;
      font-size: var(--fs-body-sm);
      color: var(--c-gray-800);
      cursor: pointer;
    }
    .chip.on {
      background: var(--c-primary);
      border-color: var(--c-primary);
      color: var(--c-primary-ink);
      font-weight: 700;
    }
  `,
})
export class ChipsComponent {
  options = input.required<SegmentOption[]>();
  value = model<string>('');
}

@Component({
  selector: 'app-stat-tile',
  standalone: true,
  template: `
    <div
      class="tile"
      [style.--tile-bg]="'var(--c-' + tint() + '-bg)'"
      [style.--tile-text]="'var(--c-' + tint() + '-text)'"
    >
      <div class="label">{{ label() }}</div>
      <div class="value num">
        {{ value() }}
        @if (unit()) {
          <span class="unit">{{ unit() }}</span>
        }
      </div>
      @if (delta() !== null) {
        <div
          class="delta num"
          [class.good]="tone() === 'good'"
          [class.bad]="tone() === 'bad'"
        >
          {{ glyph() }} {{ absDelta() }}{{ unit() }}
        </div>
      }
    </div>
  `,
  styles: `
    .tile {
      background: var(--tile-bg, var(--c-gray-100));
      border-radius: var(--radius-md);
      padding: var(--space-md) var(--space-sm);
      text-align: center;
    }
    .label {
      font-size: var(--fs-caption);
      text-transform: uppercase;
      color: var(--tile-text, var(--c-gray-600));
    }
    .value {
      font-size: var(--fs-title);
      font-weight: 700;
      color: var(--tile-text, var(--c-black));
    }
    .unit {
      font-size: var(--fs-body-sm);
      font-weight: 400;
      color: var(--c-gray-600);
      margin-left: 2px;
    }
    .delta {
      font-size: var(--fs-body-sm);
      color: var(--tile-text, var(--c-gray-600));
    }
    .delta.good {
      color: var(--c-positive-text);
    }
    .delta.bad {
      color: var(--c-protein-text);
    }
  `,
})
export class StatTileComponent {
  label = input('');
  value = input<string | number>('');
  unit = input('');
  delta = input<number | null>(null);
  /** Which direction of change is good for this metric. */
  goodDirection = input<'up' | 'down' | 'none'>('none');
  /** Pastel tone: protein | carb | fat | sky | lilac | primary. */
  tint = input<
    'protein' | 'carb' | 'fat' | 'sky' | 'lilac' | 'peach' | 'primary'
  >('primary');

  glyph() {
    const d = this.delta() ?? 0;
    return d > 0 ? '▲' : d < 0 ? '▼' : '–';
  }
  absDelta() {
    return Math.abs(this.delta() ?? 0);
  }
  tone(): 'good' | 'bad' | 'neutral' {
    const d = this.delta() ?? 0;
    const g = this.goodDirection();
    if (d === 0 || g === 'none') return 'neutral';
    return d > 0 === (g === 'up') ? 'good' : 'bad';
  }
}

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @for (r of rows(); track $index) {
      <div class="sk" [style.height.px]="height()"></div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }
    .sk {
      border-radius: var(--radius-md);
      background: linear-gradient(
        90deg,
        var(--c-gray-100) 25%,
        var(--c-gray-50) 50%,
        var(--c-gray-100) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.2s infinite linear;
    }
    @keyframes shimmer {
      to {
        background-position: -200% 0;
      }
    }
  `,
})
export class SkeletonComponent {
  count = input(4);
  height = input(56);
  rows() {
    return Array.from({ length: this.count() });
  }
}
