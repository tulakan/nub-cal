import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { MaterialModule } from '../../shared/modules/material.module';

/* import for echart */
import { CommonModule } from '@angular/common';
import { BarChart, LineChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { BodyCompositionService } from '../../shared/services/body-composition.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  CanvasRenderer,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  LegendComponent,
]);

@Component({
  selector: 'app-circumference',
  standalone: true,
  imports: [CommonModule, MaterialModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `
    <div class="container">
      <div class="loading-overlay" *ngIf="isLoading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      <div class="main-sections" *ngIf="!isLoading">
        <!-- Circumference Section -->
        <div class="circumference-section">
          <!-- Latest Data Card -->
          <mat-card class="latest-data-card">
            <mat-card-header>
              <mat-card-title>Latest Circumference</mat-card-title>
              <mat-card-subtitle>{{
                getLatestCircumferenceDate()
              }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item chest">
                  <div class="stat-label">Chest</div>
                  <div class="stat-value latest">
                    {{ getLatestCircumference().chest }} cm
                  </div>
                </div>
                <div class="stat-item arm">
                  <div class="stat-label">Arm (avg)</div>
                  <div class="stat-value latest">
                    {{ getLatestCircumference().arm }} cm
                  </div>
                </div>
                <div class="stat-item waist">
                  <div class="stat-label">Waist</div>
                  <div class="stat-value latest">
                    {{ getLatestCircumference().waist }} cm
                  </div>
                </div>
                <div class="stat-item hip">
                  <div class="stat-label">Hip</div>
                  <div class="stat-value latest">
                    {{ getLatestCircumference().hip }} cm
                  </div>
                </div>
                <div class="stat-item thigh">
                  <div class="stat-label">Thigh (avg)</div>
                  <div class="stat-value latest">
                    {{ getLatestCircumference().thigh }} cm
                  </div>
                </div>
                <div class="stat-item calf">
                  <div class="stat-label">Calf (avg)</div>
                  <div class="stat-value latest">
                    {{ getLatestCircumference().calf }} cm
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Progress Card -->
          <mat-card class="progress-card">
            <mat-card-header>
              <mat-card-title>Circumference Progress</mat-card-title>
              <mat-card-subtitle>{{
                getCircumferenceDateRange()
              }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item chest">
                  <div class="stat-label">Chest</div>
                  <div
                    class="stat-value"
                    [class.positive]="getCircumferenceProgressDiff().chest > 0"
                    [class.negative]="getCircumferenceProgressDiff().chest < 0"
                  >
                    {{ getCircumferenceProgressDiff().chest > 0 ? '+' : ''
                    }}{{ getCircumferenceProgressDiff().chest }} cm
                  </div>
                </div>
                <div class="stat-item arm">
                  <div class="stat-label">Arm (avg)</div>
                  <div
                    class="stat-value"
                    [class.positive]="getCircumferenceProgressDiff().arm > 0"
                    [class.negative]="getCircumferenceProgressDiff().arm < 0"
                  >
                    {{ getCircumferenceProgressDiff().arm > 0 ? '+' : ''
                    }}{{ getCircumferenceProgressDiff().arm }} cm
                  </div>
                </div>
                <div class="stat-item waist">
                  <div class="stat-label">Waist</div>
                  <div
                    class="stat-value"
                    [class.positive]="getCircumferenceProgressDiff().waist > 0"
                    [class.negative]="getCircumferenceProgressDiff().waist < 0"
                  >
                    {{ getCircumferenceProgressDiff().waist > 0 ? '+' : ''
                    }}{{ getCircumferenceProgressDiff().waist }} cm
                  </div>
                </div>
                <div class="stat-item hip">
                  <div class="stat-label">Hip</div>
                  <div
                    class="stat-value"
                    [class.positive]="getCircumferenceProgressDiff().hip > 0"
                    [class.negative]="getCircumferenceProgressDiff().hip < 0"
                  >
                    {{ getCircumferenceProgressDiff().hip > 0 ? '+' : ''
                    }}{{ getCircumferenceProgressDiff().hip }} cm
                  </div>
                </div>
                <div class="stat-item thigh">
                  <div class="stat-label">Thigh (avg)</div>
                  <div
                    class="stat-value"
                    [class.positive]="getCircumferenceProgressDiff().thigh > 0"
                    [class.negative]="getCircumferenceProgressDiff().thigh < 0"
                  >
                    {{ getCircumferenceProgressDiff().thigh > 0 ? '+' : ''
                    }}{{ getCircumferenceProgressDiff().thigh }} cm
                  </div>
                </div>
                <div class="stat-item calf">
                  <div class="stat-label">Calf (avg)</div>
                  <div
                    class="stat-value"
                    [class.positive]="getCircumferenceProgressDiff().calf > 0"
                    [class.negative]="getCircumferenceProgressDiff().calf < 0"
                  >
                    {{ getCircumferenceProgressDiff().calf > 0 ? '+' : ''
                    }}{{ getCircumferenceProgressDiff().calf }} cm
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          <div
            class="chart-item"
            echarts
            [options]="circumferenceChartOptions"
          ></div>
        </div>
      </div>

      <!-- Floating Action Button -->
      <button mat-fab color="primary" class="fab-btn" (click)="openAddCircumferenceDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .container {
      padding: var(--space-lg);
      position: relative;
      min-height: calc(100vh - 100px);
      box-sizing: border-box;
      width: 100%;
    }
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 10;
    }
    .main-sections {
      display: flex;
      gap: var(--space-md);
      align-items: flex-start;
      width: 100%;
    }
    .circumference-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      width: 100%;
    }
    .progress-card {
      margin-bottom: 0;
      width: 100%;
    }
    .latest-data-card {
      margin-bottom: 0;
      width: 100%;
      background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
      color: white;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .latest-data-card .mat-mdc-card-header .mat-mdc-card-title {
      color: white;
    }
    .latest-data-card .mat-mdc-card-header .mat-mdc-card-subtitle {
      color: rgba(255, 255, 255, 0.7);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: var(--space-md);
      margin-top: var(--space-md);
    }
    .stat-item {
      text-align: center;
      padding: var(--space-md);
      border-radius: var(--radius-md);
      background-color: var(--c-gray-100);
      border: var(--border);
    }
    .latest-data-card .stat-item {
      background-color: rgba(255, 255, 255, 0.95);
      border: none;
    }
    .stat-label {
      font-size: 11px;
      color: var(--c-gray-600);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--c-black);
    }
    .stat-value.positive {
      color: var(--c-positive);
    }
    .stat-value.negative {
      color: var(--c-negative);
    }
    .stat-value.latest {
      color: var(--c-black);
      font-size: 18px;
    }
    .chart-item {
      width: 100%;
      height: 400px;
    }

    /* Floating Action Button */
    .fab-btn {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 1000;
      background-color: var(--c-black);
      color: var(--c-white);
    }

    /* Responsive design for smaller screens */
    @media (max-width: 1024px) {
      .container {
        padding: var(--space-md);
      }
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 600px) {
      .container {
        padding: var(--space-xs);
      }
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-xs);
      }
      .chart-item {
        height: 260px;
      }
      .stat-item {
        padding: var(--space-xs);
      }
      .stat-label {
        font-size: 11px;
      }
      .stat-value {
        font-size: 13px;
      }
      .stat-value.latest {
        font-size: 15px;
      }
    }
  `,
})
export class CircumferencePage implements OnInit, AfterViewInit {
  private bodyCompositionService = inject(BodyCompositionService);
  private dialog = inject(MatDialog);

  circumferenceData: any[] = [];
  circumferenceChartOptions: any = {};
  isLoading = true;

  async ngOnInit(): Promise<void> {
    await this.bodyCompositionService.seedData();
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.circumferenceData = await this.bodyCompositionService.getCircumference();
    this.initChartOptions();
    this.isLoading = false;
  }

  ngAfterViewInit(): void {}

  initChartOptions() {
    this.circumferenceChartOptions = {
      title: { text: 'Body Circumference Progress' },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = new Date(params[0].axisValue);
          return `${this.formatThaiDate(date)}<br/>` + 
            params.map((p: any) => `${p.marker}${p.seriesName}: ${p.value[1]} cm`).join('<br/>');
        },
      },
      legend: {
        data: ['Chest', 'Waist', 'Hip', 'Arm (avg)', 'Thigh (avg)', 'Calf (avg)'],
      },
      grid: { top: 40, left: 40, right: 40, bottom: 32 },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: (value: number) => this.formatThaiDate(new Date(value)),
        },
      },
      yAxis: {
        type: 'value',
        name: 'Circumference (cm)',
        nameLocation: 'middle',
        nameGap: 50,
        min: (value: any) => Math.floor(value.min - 5),
      },
      series: [
        { name: 'Chest', type: 'line', data: this.circumferenceData.map(item => [item.ts, item.chest]), lineStyle: { color: '#3b82f6', width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Waist', type: 'line', data: this.circumferenceData.map(item => [item.ts, item.waist]), lineStyle: { color: '#ef4444', width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Hip', type: 'line', data: this.circumferenceData.map(item => [item.ts, item.hip]), lineStyle: { color: '#10b981', width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Arm (avg)', type: 'line', data: this.circumferenceData.map(item => [item.ts, (item.leftArm + item.rightArm) / 2]), lineStyle: { color: '#f59e0b', width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Thigh (avg)', type: 'line', data: this.circumferenceData.map(item => [item.ts, (item.leftThigh + item.rightThigh) / 2]), lineStyle: { color: '#8b5cf6', width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Calf (avg)', type: 'line', data: this.circumferenceData.map(item => [item.ts, (item.leftCalf + item.rightCalf) / 2]), lineStyle: { color: '#ec4899', width: 3 }, symbol: 'circle', symbolSize: 8 },
      ],
    };
  }

  formatThaiDate(date: Date) {
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  }

  getCircumferenceProgressDiff() {
    if (this.circumferenceData.length < 2) {
      return { chest: 0, arm: 0, waist: 0, hip: 0, thigh: 0, calf: 0 };
    }
    const firstRecord = this.circumferenceData[0];
    const lastRecord = this.circumferenceData[this.circumferenceData.length - 1];
    return {
      chest: Math.round((lastRecord.chest - firstRecord.chest) * 10) / 10,
      arm: Math.round(((lastRecord.leftArm + lastRecord.rightArm) / 2 - (firstRecord.leftArm + firstRecord.rightArm) / 2) * 10) / 10,
      waist: Math.round((lastRecord.waist - firstRecord.waist) * 10) / 10,
      hip: Math.round((lastRecord.hip - firstRecord.hip) * 10) / 10,
      thigh: Math.round(((lastRecord.leftThigh + lastRecord.rightThigh) / 2 - (firstRecord.leftThigh + firstRecord.rightThigh) / 2) * 10) / 10,
      calf: Math.round(((lastRecord.leftCalf + lastRecord.rightCalf) / 2 - (firstRecord.leftCalf + firstRecord.rightCalf) / 2) * 10) / 10,
    };
  }

  getLatestCircumference() {
    if (this.circumferenceData.length === 0) {
      return { chest: 0, arm: 0, waist: 0, hip: 0, thigh: 0, calf: 0 };
    }
    const latest = this.circumferenceData[this.circumferenceData.length - 1];
    return {
      chest: latest.chest,
      arm: Math.round(((latest.leftArm + latest.rightArm) / 2) * 10) / 10,
      waist: latest.waist,
      hip: latest.hip,
      thigh: Math.round(((latest.leftThigh + latest.rightThigh) / 2) * 10) / 10,
      calf: Math.round(((latest.leftCalf + latest.rightCalf) / 2) * 10) / 10,
    };
  }

  getLatestCircumferenceDate() {
    if (this.circumferenceData.length === 0) return '';
    const latestDate = new Date(this.circumferenceData[this.circumferenceData.length - 1].ts);
    return this.formatThaiDate(latestDate);
  }

  getCircumferenceDateRange() {
    if (this.circumferenceData.length === 0) return '';
    const firstDate = new Date(this.circumferenceData[0].ts);
    const lastDate = new Date(this.circumferenceData[this.circumferenceData.length - 1].ts);
    return `${this.formatThaiDate(firstDate)} - ${this.formatThaiDate(lastDate)}`;
  }

  openAddCircumferenceDialog() {
    const dialogRef = this.dialog.open(AddCircumferenceDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }
}

@Component({
  selector: 'app-add-circumference-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>Add Circumference</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-container">
        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="ts">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Chest (cm)</mat-label>
          <input matInput type="number" formControlName="chest">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Left Arm (cm)</mat-label>
          <input matInput type="number" formControlName="leftArm">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Right Arm (cm)</mat-label>
          <input matInput type="number" formControlName="rightArm">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Waist (cm)</mat-label>
          <input matInput type="number" formControlName="waist">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hip (cm)</mat-label>
          <input matInput type="number" formControlName="hip">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Left Thigh (cm)</mat-label>
          <input matInput type="number" formControlName="leftThigh">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Right Thigh (cm)</mat-label>
          <input matInput type="number" formControlName="rightThigh">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Left Calf (cm)</mat-label>
          <input matInput type="number" formControlName="leftCalf">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Right Calf (cm)</mat-label>
          <input matInput type="number" formControlName="rightCalf">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Note</mat-label>
          <textarea matInput formControlName="note"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid">Save</button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      padding-top: 10px;
    }
    .full-width {
      grid-column: span 2;
    }
  `
})
export class AddCircumferenceDialogComponent {
  private fb = inject(FormBuilder);
  private bodyCompositionService = inject(BodyCompositionService);
  private dialogRef = inject(MatDialogRef<AddCircumferenceDialogComponent>);

  form: FormGroup = this.fb.group({
    ts: [new Date(), Validators.required],
    chest: [null, [Validators.required, Validators.min(0)]],
    leftArm: [null, [Validators.required, Validators.min(0)]],
    rightArm: [null, [Validators.required, Validators.min(0)]],
    waist: [null, [Validators.required, Validators.min(0)]],
    hip: [null, [Validators.required, Validators.min(0)]],
    leftThigh: [null, [Validators.required, Validators.min(0)]],
    rightThigh: [null, [Validators.required, Validators.min(0)]],
    leftCalf: [null, [Validators.required, Validators.min(0)]],
    rightCalf: [null, [Validators.required, Validators.min(0)]],
    note: ['']
  });

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSave(): Promise<void> {
    if (this.form.valid) {
      const data = this.form.value;
      await this.bodyCompositionService.addCircumference(data);
      this.dialogRef.close(true);
    }
  }
}
