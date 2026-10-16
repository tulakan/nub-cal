import { Component, input } from '@angular/core';
import { MacroPipe } from '../pipes/format.pipes';

/** Pastel P / C / F pills (dark text on soft surface, AA contrast). */
@Component({
  selector: 'app-macro-chips',
  standalone: true,
  imports: [MacroPipe],
  template: `
    <span class="chip p num">P {{ protein() | macro: decimals() }}</span>
    <span class="chip c num">C {{ carb() | macro: decimals() }}</span>
    <span class="chip f num">F {{ fat() | macro: decimals() }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      gap: var(--space-xs);
      flex-wrap: wrap;
    }
    .chip {
      padding: 1px var(--space-sm);
      border-radius: 10px;
      font-size: var(--fs-caption);
      font-weight: 700;
      line-height: 16px;
    }
    .p {
      background: var(--c-protein-bg);
      color: var(--c-protein-text);
    }
    .c {
      background: var(--c-carb-bg);
      color: var(--c-carb-text);
    }
    .f {
      background: var(--c-fat-bg);
      color: var(--c-fat-text);
    }
  `,
})
export class MacroChipsComponent {
  protein = input(0);
  carb = input(0);
  fat = input(0);
  decimals = input(0);
}
