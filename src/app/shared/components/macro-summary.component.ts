import { Component, computed, input } from '@angular/core';
import { KcalPipe, MacroPipe } from '../pipes/format.pipes';
import { Macros } from '../utils/nutrition';

@Component({
  selector: 'app-macro-summary',
  standalone: true,
  imports: [KcalPipe, MacroPipe],
  template: `
    @if (variant() === 'hero') {
      <div class="hero">
        <div class="top num">
          <span class="big" [class.over]="kcalLeft() < 0">{{ absKcal() | kcal }}</span>
          <span class="cap">{{ kcalLeft() < 0 ? 'kcal over' : 'kcal left' }}</span>
          <span class="goal">of {{ target()!.kcal | kcal }}</span>
        </div>
        <div
          class="bar"
          role="progressbar"
          aria-label="Calories"
          [attr.aria-valuenow]="consumedValue().kcal | kcal"
          aria-valuemin="0"
          [attr.aria-valuemax]="target()?.kcal"
        >
          <div
            class="fill"
            [class.over]="kcalLeft() < 0"
            [style.width.%]="pct(consumedValue().kcal, target()!.kcal)"
          ></div>
        </div>
        <div class="macros">
          @for (m of macroRows(); track m.label) {
            <div class="mrow">
              <span class="mlabel">{{ m.label }}</span>
              <div
                class="bar sm"
                role="progressbar"
                [attr.aria-label]="m.label"
                [attr.aria-valuenow]="m.value | macro"
                aria-valuemin="0"
                [attr.aria-valuemax]="m.target"
              >
                <div
                  class="fill"
                  [class]="'fill ' + m.tone"
                  [class.over]="m.value > m.target"
                  [style.width.%]="pct(m.value, m.target)"
                ></div>
              </div>
              <span
                class="mval num"
                [class.flag]="m.value > m.target && m.over"
              >
                {{ abs(m.target - m.value) | macro }} g
                {{ m.value > m.target ? 'over' : 'left' }}
              </span>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="compact num">
        @if (target(); as t) {
          <span class="main" [class.over]="kcalLeft() < 0">
            {{ absKcal() | kcal }} kcal {{ kcalLeft() < 0 ? 'over' : 'left' }}{{ suffix() }}
          </span>
          <span class="sub">
            P {{ remaining().protein | macro }} · C {{ remaining().carb | macro }} · F {{ remaining().fat | macro }} g left
          </span>
        } @else {
          <span class="main">{{ consumedValue().kcal | kcal }} kcal</span>
          <span class="sub">
            P {{ consumedValue().protein | macro }} · C {{ consumedValue().carb | macro }} · F {{ consumedValue().fat | macro }} g
          </span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .hero {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
    .big {
      font-size: var(--fs-hero);
      font-weight: 700;
      line-height: 1.1;
      color: var(--c-primary-ink);
    }
    .big.over {
      color: var(--c-negative-text);
    }
    /* Hero sits on --c-primary-bg: all text uses the primary ink. */
    .top {
      display: flex;
      align-items: baseline;
      gap: var(--space-sm);
      color: var(--c-primary-ink);
    }
    .cap {
      font-size: var(--fs-body);
      font-weight: 500;
    }
    /* Sits above the bar's end: labels the bar's scale. */
    .goal {
      margin-left: auto;
      font-size: var(--fs-body-sm);
    }
    .bar {
      height: 8px;
      border-radius: 4px;
      background: var(--c-white);
      overflow: hidden;
      margin-top: var(--space-md);
    }
    .bar.sm {
      height: 6px;
      margin: 0;
      flex: 1;
    }
    .fill {
      height: 100%;
      background: var(--c-primary);
      border-radius: inherit;
      transition: width 200ms ease;
    }
    .fill.protein {
      background: var(--c-protein-fill);
    }
    .fill.carb {
      background: var(--c-carb-fill);
    }
    .fill.fat {
      background: var(--c-fat-fill);
    }
    .fill.over {
      background: var(--c-negative-fill);
    }
    .macros {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      margin-top: var(--space-md);
    }
    .mrow {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: var(--fs-body-sm);
    }
    .mlabel {
      width: 52px;
      color: var(--c-primary-ink);
      font-weight: 500;
    }
    .mval {
      min-width: 72px;
      text-align: right;
      color: var(--c-primary-ink);
    }
    .mval.flag {
      color: var(--c-negative-text);
      font-weight: 500;
    }
    .compact {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .main {
      font-size: var(--fs-body);
      font-weight: 500;
      color: var(--c-black);
    }
    .main.over {
      color: var(--c-negative-text);
    }
    .sub {
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
    }
  `,
})
export class MacroSummaryComponent {
  target = input<Macros | null>(null);
  consumed = input<Macros>({ kcal: 0, protein: 0, carb: 0, fat: 0 });
  /** Extra amount added on top of `consumed` (e.g. the food being added). */
  preview = input<Macros | null>(null);
  variant = input<'hero' | 'compact'>('compact');
  /** Text appended after "left/over" in compact mode, e.g. " after this". */
  suffix = input('');

  consumedValue = computed<Macros>(() => {
    const c = this.consumed();
    const p = this.preview();
    return p
      ? {
          kcal: c.kcal + p.kcal,
          protein: c.protein + p.protein,
          carb: c.carb + p.carb,
          fat: c.fat + p.fat,
        }
      : c;
  });

  remaining = computed<Macros>(() => {
    const t = this.target();
    const c = this.consumedValue();
    if (!t) return { kcal: 0, protein: 0, carb: 0, fat: 0 };
    return {
      kcal: t.kcal - c.kcal,
      protein: t.protein - c.protein,
      carb: t.carb - c.carb,
      fat: t.fat - c.fat,
    };
  });

  kcalLeft = computed(() => this.remaining().kcal);
  absKcal = computed(() => Math.abs(this.kcalLeft()));

  macroRows = computed(() => {
    const t = this.target();
    const c = this.consumedValue();
    if (!t) return [];
    return [
      { label: 'Protein', tone: 'protein', value: c.protein, target: t.protein, over: false },
      { label: 'Carbs', tone: 'carb', value: c.carb, target: t.carb, over: true },
      { label: 'Fat', tone: 'fat', value: c.fat, target: t.fat, over: true },
    ];
  });

  abs = Math.abs;

  pct(value: number, target: number): number {
    if (!(target > 0)) return 0;
    return Math.min(100, Math.max(0, (value / target) * 100));
  }
}
