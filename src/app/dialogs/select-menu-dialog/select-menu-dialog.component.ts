import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Menu } from '../../shared/interface/menu.interface';
import { MaterialModule } from '../../shared/modules/material.module';

@Component({
  selector: 'app-select-menu-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './select-menu-dialog.component.html',
  styleUrls: ['./select-menu-dialog.component.scss'],
})
export class SelectMenuDialogComponent {
  private dialogRef = inject(MatDialogRef<SelectMenuDialogComponent>);
  private data: { menus: Menu[] } = inject(MAT_DIALOG_DATA);

  searchQuery = '';
  filteredMenus: Menu[] = [...this.data.menus];

  filterMenus() {
    if (!this.searchQuery.trim()) {
      this.filteredMenus = [...this.data.menus];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredMenus = this.data.menus.filter(menu =>
        menu.name.toLowerCase().includes(query)
      );
    }
  }

  selectMenu(menu: Menu) {
    this.dialogRef.close(menu);
  }

  close() {
    this.dialogRef.close();
  }
}
