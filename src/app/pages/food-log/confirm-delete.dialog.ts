import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm-delete-dialog">
      <div class="dialog-header">
        <h2>Delete food?</h2>
      </div>

      <div class="dialog-content">
        <p class="food-name">{{ data.foodName }}</p>
        <p class="confirm-text">This action cannot be undone.</p>
      </div>

      <div class="dialog-actions">
        <button
          mat-stroked-button
          (click)="onCancel()"
          class="cancel-btn"
        >
          Cancel
        </button>
        <button
          mat-raised-button
          (click)="onConfirm()"
          class="delete-btn"
        >
          Delete
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-delete-dialog {
      display: flex;
      flex-direction: column;
      gap: var(--space-md, 12px);
      padding: var(--space-md, 12px);
    }

    .dialog-header {
      h2 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--c-black, #1a1a1a);
      }
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs, 4px);

      .food-name {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--c-black, #1a1a1a);
      }

      .confirm-text {
        margin: 0;
        font-size: 12px;
        color: var(--c-gray-600, #666666);
      }
    }

    .dialog-actions {
      display: flex;
      gap: var(--space-sm, 8px);
      justify-content: flex-end;

      .cancel-btn {
        flex: 1;
      }

      .delete-btn {
        flex: 1;
        background-color: var(--c-negative, #ef4444);
        color: white;

        &:hover {
          background-color: #dc2626;
        }
      }
    }
  `],
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { foodName: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
