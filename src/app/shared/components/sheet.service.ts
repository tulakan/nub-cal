import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';

@Injectable({ providedIn: 'root' })
export class SheetService {
  private sheet = inject(MatBottomSheet);

  open<T, R = unknown>(
    component: ComponentType<T>,
    data?: unknown
  ): MatBottomSheetRef<T, R> {
    return this.sheet.open<T, unknown, R>(component, {
      data,
      panelClass: 'nub-sheet',
      autoFocus: false,
      restoreFocus: true,
    });
  }
}
