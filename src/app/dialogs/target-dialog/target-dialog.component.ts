import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogLayoutComponent } from '../../shared/components/dialog-layout.component';
import { TargetMacros } from '../../shared/interface/nutrition.interface';
import { MaterialModule } from '../../shared/modules/material.module';

export interface TargetDialogData {
  currentTargets: TargetMacros;
}

@Component({
  selector: 'app-target-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    CommonModule,
    DialogLayoutComponent,
  ],
  templateUrl: './target-dialog.component.html',
  styleUrls: ['./target-dialog.component.scss'],
})
export class TargetDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TargetDialogComponent>);

  targetForm!: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: TargetDialogData) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.targetForm = this.fb.group({
      kcal: [
        this.data.currentTargets.kcal,
        [Validators.required, Validators.min(1)],
      ],
      protein: [
        this.data.currentTargets.protein,
        [Validators.required, Validators.min(1)],
      ],
      carb: [
        this.data.currentTargets.carb,
        [Validators.required, Validators.min(1)],
      ],
      fat: [
        this.data.currentTargets.fat,
        [Validators.required, Validators.min(1)],
      ],
    });
  }

  updateTargets() {
    if (this.targetForm.valid) {
      const updatedTargets: TargetMacros = this.targetForm.value;
      this.dialogRef.close(updatedTargets);
      this.snackBar.open('Target macros updated successfully', 'Close', {
        duration: 2000,
      });
    }
  }

  resetTargets() {
    const defaultTargets: TargetMacros = {
      kcal: 2000,
      protein: 150,
      carb: 250,
      fat: 67,
    };
    this.targetForm.patchValue(defaultTargets);
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Dialog layout event handlers
  onSave() {
    this.updateTargets();
  }

  onReset() {
    this.resetTargets();
  }

  onCloseDialog() {
    this.dialogRef.close();
  }
}
