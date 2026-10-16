import { Component, computed, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { qtyStep } from '../utils/nutrition';

@Component({
  selector: 'app-qty-input',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="qty" [class.compact]="compact()">
      @if (!compact()) {
        <button
          type="button"
          class="step"
          aria-label="Decrease"
          (click)="bump(-1)"
        >
          <mat-icon>remove</mat-icon>
        </button>
      }
      <input
        type="text"
        inputmode="decimal"
        class="num"
        [value]="value()"
        [attr.aria-label]="'Quantity in ' + unit()"
        (focus)="$any($event.target).select()"
        (input)="onInput($any($event.target).value)"
      />
      @if (unit()) {
        <span class="unit">{{ unit() }}</span>
      }
      @if (!compact()) {
        <button
          type="button"
          class="step"
          aria-label="Increase"
          (click)="bump(1)"
        >
          <mat-icon>add</mat-icon>
        </button>
      }
    </div>
  `,
  styles: `
    .qty {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      justify-content: center;
    }
    .qty.compact {
      gap: var(--space-xs);
      justify-content: flex-end;
    }
    input {
      width: 96px;
      height: 48px;
      text-align: center;
      border: 1px solid var(--c-gray-400);
      border-radius: var(--radius-md);
      background: var(--c-white);
      color: var(--c-black);
      font-weight: 500;
    }
    .compact input {
      width: 64px;
      height: 36px;
    }
    .unit {
      font-size: var(--fs-body);
      color: var(--c-gray-600);
      min-width: 24px;
    }
    .step {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 0;
      background: var(--c-primary-bg);
      color: var(--c-primary-ink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  `,
})
export class QtyInputComponent {
  value = model<number>(0);
  unit = input('');
  compact = input(false);
  step = input<number | null>(null);

  private stepSize = computed(() => this.step() ?? qtyStep(this.unit()));

  onInput(raw: string) {
    const n = parseFloat(raw.replace(',', '.'));
    if (!isNaN(n) && n > 0) this.value.set(n);
  }

  bump(dir: 1 | -1) {
    const next = Math.round((this.value() + dir * this.stepSize()) * 100) / 100;
    if (next > 0) this.value.set(next);
  }
}
