import {
  Component,
  EventEmitter,
  Output,
  effect,
  inject,
  input,
} from '@angular/core';
import { MaterialModule } from '../modules/material.module';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'dialog-layout',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header-container">
        <div class="dialog-title">{{ title() }}</div>
        <span class="spacer"></span>
        <mat-icon class="close-icon" (click)="closeDialog()">close</mat-icon>
      </div>

      <div class="dialog-content-container">
        <ng-content class="flex flex-grow"></ng-content>
      </div>

      <div class="dialog-action-button-container">
        @if (showActionButton()) {
          <button
            class="dialog-action-btn action"
            mat-raised-button
            color="primary"
            (click)="action()"
            [disabled]="disableActionButton()"
          >
            {{ actionButtonLabel() }}
          </button>
        }
        @if (showCancelButton()) {
          <button
            class="dialog-action-btn"
            mat-raised-button
            color="warn"
            (click)="cancel()"
            [disabled]="disableCancelButton()"
          >
            {{ cancelButtonLabel() }}
          </button>
        }
        @if (showResetButton()) {
          <button
            class="dialog-action-btn"
            mat-raised-button
            (click)="reset()"
            [disabled]="disableResetButton()"
          >
            Reset
          </button>
        }
        @if (showSaveButton()) {
          <button
            class="dialog-action-btn"
            mat-raised-button
            color="primary"
            (click)="save()"
            [disabled]="disableSaveButton()"
          >
            Save
          </button>
        }
        @if (showConfirmButton()) {
          <button
            class="dialog-action-btn"
            mat-raised-button
            color="primary"
            (click)="confirm()"
            [disabled]="disableConfirmButton()"
          >
            @if (processing()) {
              <mat-spinner color="primary" diameter="20"></mat-spinner>
            } @else {
              {{ confirmButtonLabel() }}
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .dialog-container {
      @apply w-full h-full p-4 flex flex-col justify-start items-start;
    }

    .dialog-header-container {
      @apply w-full flex flex-row justify-start items-start;
    }

    .dialog-title {
      color: var(--primary);
      @apply text-base font-bold;
    }

    .close-icon {
      $IC_SIZE: 24px;
      @apply cursor-pointer;
      width: $IC_SIZE;
      height: $IC_SIZE;
      font-size: $IC_SIZE;
    }

    .dialog-content-container {
      @apply w-full flex-grow overflow-y-scroll my-2;
    }

    .dialog-action-button-container {
      @apply w-full flex flex-row justify-end items-center mt-auto gap-x-2;
    }

    .dialog-action-btn {
      @apply w-28;
      &.action {
        width: fit-content !important;
        margin-right: auto;
      }
    }
  `,
})
export class DialogLayoutComponent {
  // utils = inject(Utils);
  service = inject(ApiService);

  title = input('Dialog Title');
  showResetButton = input(false);
  showCancelButton = input(false);
  showSaveButton = input(false);
  showConfirmButton = input(false);
  showActionButton = input(false);

  disableResetButton = input(false);
  disableCancelButton = input(false);
  disableSaveButton = input(false);
  disableConfirmButton = input(false);
  disableActionButton = input(false);

  confirmButtonLabel = input('Confirm');
  cancelButtonLabel = input('Cancel');
  actionButtonLabel = input('Action');
  processing = input(false);

  @Output() onCloseDialog = new EventEmitter<any>();
  @Output() onReset = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<any>();
  @Output() onConfirm = new EventEmitter<any>();
  @Output() onAction = new EventEmitter<any>();

  constructor() {
    effect(() => {
      // const disableActionButton = this.disableActionButton();
    });
  }

  // dialogRef = inject(MatDialogRef<any>);
  closeDialog() {
    this.onCloseDialog.emit();
    // this.dialogRef.close();
  }

  reset() {
    this.onReset.emit();
  }
  cancel() {
    this.onCancel.emit();
  }
  save() {
    this.onSave.emit();
  }

  confirm() {
    this.onConfirm.emit();
  }

  action() {
    this.onAction.emit();
  }
}
