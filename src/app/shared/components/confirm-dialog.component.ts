import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Injectable } from '@angular/core';

export interface ConfirmData {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm">
      <div class="title">{{ data.title }}</div>
      @if (data.message) {
        <div class="msg">{{ data.message }}</div>
      }
      <div class="actions">
        <button mat-button [mat-dialog-close]="false">
          {{ data.cancelLabel || 'Cancel' }}
        </button>
        <button
          mat-flat-button
          class="ok"
          [class.destructive]="data.destructive"
          [mat-dialog-close]="true"
        >
          {{ data.confirmLabel || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .confirm {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      padding: var(--space-lg);
    }
    .title {
      font-size: var(--fs-subtitle);
      font-weight: 700;
      color: var(--c-black);
    }
    .msg {
      font-size: var(--fs-body);
      color: var(--c-gray-600);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }
    .actions button {
      min-height: 44px;
    }
    .ok {
      background: var(--c-primary);
      color: var(--c-primary-ink);
      font-weight: 700;
    }
    .ok.destructive {
      background: var(--c-protein-fill);
      color: var(--c-protein-text);
    }
  `,
})
export class ConfirmDialogComponent {
  data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private dialog = inject(MatDialog);

  ask(data: ConfirmData): Promise<boolean> {
    return new Promise(resolve => {
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          width: '320px',
          maxWidth: '90vw',
          autoFocus: false,
        })
        .afterClosed()
        .subscribe(r => resolve(r === true));
    });
  }
}
