import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../components/confirm-dialog.component';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = c => {
  if (!c.hasUnsavedChanges()) return true;
  return inject(ConfirmService).ask({
    title: 'Discard changes?',
    message: 'Your edits to this menu have not been saved.',
    confirmLabel: 'Discard',
    destructive: true,
  });
};
