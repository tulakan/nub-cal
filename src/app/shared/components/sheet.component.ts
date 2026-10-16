import { Component, inject, input, output } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';

/**
 * Layout for bottom-sheet content: grabber, header (title + close), scroll body,
 * optional sticky footer (`<div sheetFooter>`).
 */
@Component({
  selector: 'app-sheet',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="sheet">
      <div class="grabber" aria-hidden="true"></div>
      <div class="head">
        @if (showBack()) {
          <button
            type="button"
            class="icon-btn"
            aria-label="Back"
            (click)="back.emit()"
          >
            <mat-icon>arrow_back</mat-icon>
          </button>
        }
        <div class="title">{{ title() }}</div>
        <button
          type="button"
          class="icon-btn"
          aria-label="Close"
          (click)="close()"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="body"><ng-content /></div>
      <div class="foot"><ng-content select="[sheetFooter]" /></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .sheet {
      display: flex;
      flex-direction: column;
      max-height: calc(100dvh - var(--safe-top) - 24px);
      padding-bottom: var(--safe-bottom);
    }
    .grabber {
      width: 32px;
      height: 4px;
      border-radius: 2px;
      background: var(--c-gray-200);
      margin: var(--space-sm) auto 0;
      flex: none;
    }
    .head {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-xs) var(--space-xs) 0 var(--space-lg);
      flex: none;
    }
    .head:has(.icon-btn:first-child) {
      padding-left: var(--space-xs);
    }
    .title {
      flex: 1;
      font-size: var(--fs-subtitle);
      font-weight: 700;
      color: var(--c-black);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon-btn {
      width: 44px;
      height: 44px;
      border: 0;
      background: transparent;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--c-gray-600);
      cursor: pointer;
    }
    .body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: var(--space-sm) var(--space-lg) var(--space-md);
    }
    .foot {
      flex: none;
      padding: var(--space-sm) var(--space-lg) var(--space-md);
      border-top: var(--border);
      background: var(--c-white);
    }
    .foot:empty {
      display: none;
    }
  `,
})
export class SheetComponent {
  private ref = inject(MatBottomSheetRef, { optional: true });

  title = input('');
  showBack = input(false);
  back = output<void>();
  closed = output<void>();

  close() {
    this.closed.emit();
    this.ref?.dismiss();
  }
}
