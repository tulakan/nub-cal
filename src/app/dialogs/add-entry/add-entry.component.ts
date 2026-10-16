import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { SheetComponent } from '../../shared/components/sheet.component';
import { UndoService } from '../../shared/components/undo.service';
import { formatThaiDate } from '../../shared/pipes/format.pipes';
import { BodyCompositionService } from '../../shared/services/body-composition.service';
import { localDateKey } from '../../shared/utils/date-key';

export interface AddEntryData {
  kind: 'body' | 'measure';
  /** Latest entry, used to prefill. */
  last: Record<string, any> | null;
}

interface Field {
  key: string;
  label: string;
  unit: string;
}

const BODY: Field[] = [
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'percentFat', label: 'Fat %', unit: '%' },
  { key: 'fatMass', label: 'Fat mass', unit: 'kg' },
  { key: 'muscleMass', label: 'Muscle', unit: 'kg' },
  { key: 'visceralFat', label: 'Visceral fat', unit: '' },
];

const MEASURE: Field[] = [
  { key: 'chest', label: 'Chest', unit: 'cm' },
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'hip', label: 'Hip', unit: 'cm' },
  { key: 'leftArm', label: 'Arm L', unit: 'cm' },
  { key: 'rightArm', label: 'Arm R', unit: 'cm' },
  { key: 'leftThigh', label: 'Thigh L', unit: 'cm' },
  { key: 'rightThigh', label: 'Thigh R', unit: 'cm' },
  { key: 'leftCalf', label: 'Calf L', unit: 'cm' },
  { key: 'rightCalf', label: 'Calf R', unit: 'cm' },
];

@Component({
  selector: 'app-add-entry',
  standalone: true,
  imports: [SheetComponent],
  template: `
    <app-sheet [title]="data.kind === 'body' ? 'Add body composition' : 'Add measurements'">
      <div class="form">
        <label class="nub-field">
          <span>Date</span>
          <input class="nub-input" type="date" [value]="date()" [max]="today"
                 (input)="date.set($any($event.target).value)" />
        </label>
        @if (prefillNote()) {
          <div class="note">{{ prefillNote() }}</div>
        }
        <div class="grid">
          @for (f of fields; track f.key) {
            <label class="nub-field">
              <span>{{ f.label }}{{ f.unit ? ' (' + f.unit + ')' : '' }}</span>
              <input class="nub-input num" type="text" inputmode="decimal" enterkeyhint="next"
                     [class.invalid]="submitted() && values()[f.key] === null"
                     [value]="values()[f.key] ?? ''"
                     (input)="set(f.key, $any($event.target).value)" />
            </label>
          }
        </div>
        @if (data.kind === 'measure') {
          <label class="same">
            <input type="checkbox" [checked]="same()" (change)="same.set($any($event.target).checked)" />
            Same for left and right
          </label>
        }
        @if (!noteOpen()) {
          <button type="button" class="nub-btn text left" (click)="noteOpen.set(true)">+ Add note</button>
        } @else {
          <label class="nub-field">
            <span>Note</span>
            <input class="nub-input" type="text" [value]="note()" (input)="note.set($any($event.target).value)" />
          </label>
        }
      </div>
      <div sheetFooter>
        <button type="button" class="nub-btn" [disabled]="saving()" (click)="save()">Save</button>
      </div>
    </app-sheet>
  `,
  styles: `
    .form { display: flex; flex-direction: column; gap: var(--space-md); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
    .note { font-size: var(--fs-body-sm); color: var(--c-gray-600); margin-top: calc(var(--space-sm) * -1); }
    .same { display: flex; align-items: center; gap: var(--space-sm); min-height: 44px; font-size: var(--fs-body); }
    .same input { width: 20px; height: 20px; accent-color: var(--c-black); }
    .left { justify-content: flex-start; padding: 0; }
  `,
})
export class AddEntryComponent {
  private ref = inject(MatBottomSheetRef<AddEntryComponent>);
  private svc = inject(BodyCompositionService);
  private undo = inject(UndoService);
  data = inject<AddEntryData>(MAT_BOTTOM_SHEET_DATA);

  fields = this.data.kind === 'body' ? BODY : MEASURE;
  today = localDateKey();
  date = signal(this.today);
  note = signal('');
  noteOpen = signal(false);
  same = signal(false);
  saving = signal(false);
  submitted = signal(false);
  private fatMassEdited = false;

  values = signal<Record<string, number | null>>(
    Object.fromEntries(this.fields.map(f => [f.key, (this.data.last?.[f.key] as number) ?? null]))
  );

  prefillNote = computed(() =>
    this.data.last?.['ts'] ? `Prefilled from ${formatThaiDate(this.data.last['ts'])}` : ''
  );

  set(key: string, raw: string) {
    const n = parseFloat(raw.replace(',', '.'));
    const v = isNaN(n) || n < 0 ? null : n;
    const next = { ...this.values(), [key]: v };
    if (this.data.kind === 'body') {
      if (key === 'fatMass') this.fatMassEdited = true;
      if ((key === 'weight' || key === 'percentFat') && !this.fatMassEdited) {
        const w = next['weight'];
        const p = next['percentFat'];
        if (w !== null && p !== null) next['fatMass'] = Math.round(((w * p) / 100) * 10) / 10;
      }
    } else if (this.same() && key.startsWith('left')) {
      next['right' + key.slice(4)] = v;
    }
    this.values.set(next);
  }

  async save() {
    this.submitted.set(true);
    const v = this.values();
    if (this.fields.some(f => v[f.key] === null)) return;
    const [y, m, d] = this.date().split('-').map(Number);
    const payload: any = { ts: new Date(y, m - 1, d, 12), ...v, note: this.note().trim() };
    this.saving.set(true);
    try {
      if (this.data.kind === 'body') await this.svc.addBodyComposition(payload);
      else await this.svc.addCircumference(payload);
      this.undo.notify('Entry saved');
      this.ref.dismiss(true);
    } catch (e) {
      console.error(e);
      this.undo.notify('Could not save. Please try again.');
      this.saving.set(false);
    }
  }
}
