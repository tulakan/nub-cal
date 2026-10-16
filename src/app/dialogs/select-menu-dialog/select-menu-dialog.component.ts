import { Component, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MenuPlanStore } from '../../stores/menu-plan.store';
import { MenuPickerComponent } from '../../shared/components/menu-picker.component';
import { SheetComponent } from '../../shared/components/sheet.component';
import { UndoService } from '../../shared/components/undo.service';
import { Menu } from '../../shared/interface/menu.interface';

/** Pick a saved menu and add it to today's plan. */
@Component({
  selector: 'app-select-menu-dialog',
  standalone: true,
  imports: [SheetComponent, MenuPickerComponent],
  template: `
    <app-sheet title="Add menu to plan">
      <app-menu-picker (pick)="add($event)" />
    </app-sheet>
  `,
})
export class SelectMenuDialogComponent {
  private ref = inject(MatBottomSheetRef<SelectMenuDialogComponent>);
  private store = inject(MenuPlanStore);
  private undo = inject(UndoService);

  add(menu: Menu) {
    const id = this.store.addToPlan(menu);
    this.undo.undoable(`${menu.name} added to plan`, () => this.store.removeInstance(id));
    this.ref.dismiss();
  }
}
