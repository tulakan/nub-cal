import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SheetComponent } from './sheet.component';

export const GUIDE_STEPS = [
  {
    icon: 'restaurant',
    tone: 'primary',
    title: 'Today',
    text: 'See calories left at a glance. The bars show protein, carbs and fat against your targets.',
  },
  {
    icon: 'add_circle',
    tone: 'primary',
    title: 'Log food fast',
    text: 'Tap Add, search, set the amount, done. Foods you logged recently show first.',
  },
  {
    icon: 'swipe_left',
    tone: 'protein',
    title: 'Swipe & tap',
    text: 'Swipe a row left to delete it (Undo appears). Tap a row to change the amount.',
  },
  {
    icon: 'restaurant_menu',
    tone: 'carb',
    title: 'Menus',
    text: 'Group foods you often eat together, like your usual breakfast, and log them in one tap.',
  },
  {
    icon: 'event_note',
    tone: 'fat',
    title: 'Plan',
    text: 'Plan today’s meals ahead and see what is left. Tap “Log plan” when you eat.',
  },
  {
    icon: 'menu_book',
    tone: 'lilac',
    title: 'Foods',
    text: 'Your food library. Add foods using the values on the nutrition label (per 100 g or per piece).',
  },
  {
    icon: 'show_chart',
    tone: 'peach',
    title: 'Progress',
    text: 'Log weight and measurements about once a week, same time of day. Tap a tile to chart it.',
  },
  {
    icon: 'install_mobile',
    tone: 'primary',
    title: 'Use it like an app',
    text: 'Add Nub Cal to your Home Screen (Share → Add to Home Screen). It works offline too.',
  },
];

/** Tour cards, used in onboarding and the Settings "How to use" sheet. */
@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="list">
      @for (s of steps; track s.title) {
        <div class="card">
          <div
            class="ic"
            [style.background]="'var(--c-' + s.tone + '-bg)'"
            [style.color]="'var(--c-' + s.tone + '-text, var(--c-primary-ink))'"
          >
            <mat-icon>{{ s.icon }}</mat-icon>
          </div>
          <div class="txt">
            <div class="t">{{ s.title }}</div>
            <div class="d">{{ s.text }}</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .list {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }
    .card {
      display: flex;
      gap: var(--space-md);
      align-items: flex-start;
    }
    .ic {
      flex: none;
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .t {
      font-size: var(--fs-body);
      font-weight: 700;
      color: var(--c-black);
    }
    .d {
      font-size: var(--fs-body-sm);
      color: var(--c-gray-600);
      line-height: 1.5;
    }
  `,
})
export class GuideComponent {
  steps = GUIDE_STEPS;
}

@Component({
  selector: 'app-guide-sheet',
  standalone: true,
  imports: [SheetComponent, GuideComponent],
  template: `<app-sheet title="How to use Nub Cal"><app-guide /></app-sheet>`,
})
export class GuideSheetComponent {}
