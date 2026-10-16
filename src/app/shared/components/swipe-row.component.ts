import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Swipe-left-to-delete row. Pointer-events based (CDK Drag sets
 * `touch-action: none`, which blocks vertical scrolling of lists).
 * With `confirm`, the row springs back and the parent shows a confirm dialog.
 */
@Component({
  selector: 'app-swipe-row',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="swipe">
      <div class="bg" aria-hidden="true" [style.opacity]="dx() < 0 ? 1 : 0">
        <mat-icon>delete</mat-icon>
      </div>
      <div
        class="fg"
        [class.settle]="settling()"
        [style.transform]="'translateX(' + dx() + 'px)'"
        (pointerdown)="down($event)"
        (pointermove)="move($event)"
        (pointerup)="up($event)"
        (pointercancel)="cancel()"
      >
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .swipe {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius-md);
    }
    .bg {
      position: absolute;
      inset: 0;
      background: var(--c-negative);
      color: var(--c-white);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: var(--space-lg);
    }
    .fg {
      position: relative;
      background: var(--c-white);
      touch-action: pan-y;
      will-change: transform;
    }
    .fg.settle {
      transition: transform 180ms ease;
    }
  `,
})
export class SwipeRowComponent {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Spring back and let the parent confirm instead of sliding out. */
  confirm = input(false);
  disabled = input(false);
  delete = output<void>();

  dx = signal(0);
  settling = signal(false);

  private startX = 0;
  private startY = 0;
  private pointerId: number | null = null;
  private horizontal = false;
  private startT = 0;
  private suppressClick = false;
  private crossed = false;

  constructor() {
    this.el.nativeElement.addEventListener(
      'click',
      e => {
        if (this.suppressClick) {
          e.stopPropagation();
          e.preventDefault();
          this.suppressClick = false;
        }
      },
      true
    );
  }

  down(e: PointerEvent) {
    if (this.disabled() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startT = Date.now();
    this.horizontal = false;
    this.crossed = false;
    this.settling.set(false);
  }

  move(e: PointerEvent) {
    if (this.pointerId !== e.pointerId) return;
    const mx = e.clientX - this.startX;
    const my = e.clientY - this.startY;
    if (!this.horizontal) {
      if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my) * 1.5) {
        this.horizontal = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } else if (Math.abs(my) > 8) {
        this.pointerId = null; // vertical scroll wins
        return;
      } else {
        return;
      }
    }
    const width = this.el.nativeElement.offsetWidth;
    const x = Math.max(-width, Math.min(0, mx));
    this.dx.set(x);
    const past = -x > width * 0.35;
    if (past && !this.crossed) navigator.vibrate?.(10);
    this.crossed = past;
  }

  up(e: PointerEvent) {
    if (this.pointerId !== e.pointerId) return;
    this.pointerId = null;
    if (!this.horizontal) return;
    this.suppressClick = true;
    setTimeout(() => (this.suppressClick = false), 100);
    const width = this.el.nativeElement.offsetWidth;
    const dt = Math.max(1, Date.now() - this.startT);
    const fling = -this.dx() / dt > 0.6 && -this.dx() > 40;
    this.settling.set(true);
    if (-this.dx() > width * 0.35 || fling) {
      if (this.confirm()) {
        this.dx.set(0);
        this.delete.emit();
      } else {
        this.dx.set(-width);
        setTimeout(() => this.delete.emit(), 180);
      }
    } else {
      this.dx.set(0);
    }
  }

  cancel() {
    this.pointerId = null;
    if (this.dx() !== 0) {
      this.settling.set(true);
      this.dx.set(0);
    }
  }
}
