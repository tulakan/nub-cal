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
  selector: 'app-body-composition',
  standalone: true,
  imports: [CommonModule, MaterialModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `
    <div class="container">
      <div class="loading-overlay" *ngIf="isLoading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      <div class="main-sections" *ngIf="!isLoading">
        <!-- Body Composition Section -->
        <div class="body-composition-section">
          <!-- Latest Data Card -->
          <mat-card class="latest-data-card">
            <mat-card-header>
              <mat-card-title>Latest Body Composition</mat-card-title>
              <mat-card-subtitle>{{
                getLatestBodyCompositionDate()
              }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item weight">
                  <div class="stat-label">Weight</div>
                  <div class="stat-value latest">
                    {{ getLatestBodyComposition().weight }} kg
                  </div>
                </div>
                <div class="stat-item fat">
                  <div class="stat-label">Fat Mass</div>
                  <div class="stat-value latest">
                    {{ getLatestBodyComposition().fatMass }} kg
                  </div>
                </div>
                <div class="stat-item muscle">
                  <div class="stat-label">Muscle Mass</div>
                  <div class="stat-value latest">
                    {{ getLatestBodyComposition().muscleMass }} kg
                  </div>
                </div>
                <div class="stat-item fat-percentage">
                  <div class="stat-label">Fat %</div>
                  <div class="stat-value latest">
                    {{ getLatestBodyComposition().percentFat }}%
                  </div>
                </div>
                <div class="stat-item visceral">
                  <div class="stat-label">Visceral Fat</div>
                  <div class="stat-value latest">
                    {{ getLatestBodyComposition().visceralFat }}
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Progress Card -->
          <mat-card class="progress-card">
            <mat-card-header>
              <mat-card-title>Body Composition Progress</mat-card-title>
              <mat-card-subtitle>{{ getDateRange() }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item weight">
                  <div class="stat-label">Weight</div>
                  <div
                    class="stat-value"
                    [class.positive]="getProgressDiff().weight > 0"
                    [class.negative]="getProgressDiff().weight < 0"
                  >
                    {{ getProgressDiff().weight > 0 ? '+' : ''
                    }}{{ getProgressDiff().weight }} kg
                  </div>
                </div>
                <div class="stat-item fat">
                  <div class="stat-label">Fat Mass</div>
                  <div
                    class="stat-value"
                    [class.positive]="getProgressDiff().fatMass > 0"
                    [class.negative]="getProgressDiff().fatMass < 0"
                  >
                    {{ getProgressDiff().fatMass > 0 ? '+' : ''
                    }}{{ getProgressDiff().fatMass }} kg
                  </div>
                </div>
                <div class="stat-item muscle">
                  <div class="stat-label">Muscle Mass</div>
                  <div
                    class="stat-value"
                    [class.positive]="getProgressDiff().muscleMass > 0"
                    [class.negative]="getProgressDiff().muscleMass < 0"
                  >
                    {{ getProgressDiff().muscleMass > 0 ? '+' : ''
                    }}{{ getProgressDiff().muscleMass }} kg
                  </div>
                </div>
                <div class="stat-item fat-percentage">
                  <div class="stat-label">Fat %</div>
                  <div
                    class="stat-value"
                    [class.positive]="getProgressDiff().percentFat > 0"
                    [class.negative]="getProgressDiff().percentFat < 0"
                  >
                    {{ getProgressDiff().percentFat > 0 ? '+' : ''
                    }}{{ getProgressDiff().percentFat }}%
                  </div>
                </div>
                <div class="stat-item visceral">
                  <div class="stat-label">Visceral Fat</div>
                  <div
                    class="stat-value"
                    [class.positive]="getProgressDiff().visceralFat > 0"
                    [class.negative]="getProgressDiff().visceralFat < 0"
                  >
                    {{ getProgressDiff().visceralFat > 0 ? '+' : ''
                    }}{{ getProgressDiff().visceralFat }}
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          <div class="chart-item" echarts [options]="chartOptions"></div>
        </div>
      </div>

      <!-- Floating Action Button -->
      <button mat-fab color="primary" class="fab-btn" (click)="openAddBodyCompositionDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .container {
      padding: 16px;
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
      gap: 20px;
      align-items: flex-start;
      width: 100%;
    }
    .body-composition-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
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
      border-radius: 12px;
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
      gap: 12px;
      margin-top: 16px;
    }
    .stat-item {
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      background-color: #f9f9f9;
      border: 1px solid #eaeaea;
    }
    .latest-data-card .stat-item {
      background-color: rgba(255, 255, 255, 0.95);
      border: none;
    }
    .stat-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .stat-value.positive {
      color: #10b981;
    }
    .stat-value.negative {
      color: #ef4444;
    }
    .stat-value.latest {
      color: #000;
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
      background-color: #000;
      color: #fff;
    }

    /* Responsive design for smaller screens */
    @media (max-width: 1024px) {
      .container {
        padding: 12px;
      }
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 600px) {
      .container {
        padding: 8px;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .chart-item {
        height: 300px;
      }
      .stat-item {
        padding: 8px;
      }
      .stat-value {
        font-size: 14px;
      }
      .stat-value.latest {
        font-size: 16px;
      }
    }
  `,
})
export class BodyCompositionPage implements OnInit, AfterViewInit {
  private bodyCompositionService = inject(BodyCompositionService);
  private dialog = inject(MatDialog);

  bodyCompositionData: any[] = [];
  chartOptions: any = {};
  isLoading = true;

  async ngOnInit(): Promise<void> {
    await this.bodyCompositionService.seedData(); // Seed data if empty
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.bodyCompositionData = await this.bodyCompositionService.getBodyComposition();
    this.initChartOptions();
    this.isLoading = false;
  }

  ngAfterViewInit(): void {}

  initChartOptions() {
    this.chartOptions = {
      title: { text: 'Body Composition Progress' },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = new Date(params[0].axisValue);
          return `${this.formatThaiDate(date)}<br/>` + 
            params.map((p: any) => `${p.marker}${p.seriesName}: ${p.value[1]}`).join('<br/>');
        },
      },
      legend: { data: ['Weight (kg)', 'Fat Mass (kg)', 'Muscle Mass (kg)'] },
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
        name: 'Weight (kg)',
        nameLocation: 'middle',
        nameGap: 50,
        min: (value: any) => Math.floor(value.min - 5),
      },
      series: [
        { name: 'Weight (kg)', type: 'line', data: this.bodyCompositionData.map(item => [item.ts, item.weight]), lineStyle: { color: '#3b82f6', width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Fat Mass (kg)', type: 'line', data: this.bodyCompositionData.map(item => [item.ts, item.fatMass]), lineStyle: { color: '#ef4444', width: 3 }, symbol: 'circle', symbolSize: 8 },
        { name: 'Muscle Mass (kg)', type: 'line', data: this.bodyCompositionData.map(item => [item.ts, item.muscleMass]), lineStyle: { color: '#10b981', width: 3 }, symbol: 'circle', symbolSize: 8 },
      ],
    };
  }

  getProgressDiff() {
    if (this.bodyCompositionData.length < 2) {
      return { weight: 0, fatMass: 0, muscleMass: 0, percentFat: 0, visceralFat: 0 };
    }
    const firstRecord = this.bodyCompositionData[1];
    const lastRecord = this.bodyCompositionData[this.bodyCompositionData.length - 1];
    return {
      weight: Math.round((lastRecord.weight - firstRecord.weight) * 10) / 10,
      fatMass: Math.round((lastRecord.fatMass - firstRecord.fatMass) * 10) / 10,
      muscleMass: Math.round((lastRecord.muscleMass - firstRecord.muscleMass) * 10) / 10,
      percentFat: Math.round((lastRecord.percentFat - firstRecord.percentFat) * 10) / 10,
      visceralFat: lastRecord.visceralFat - firstRecord.visceralFat,
    };
  }

  getLatestBodyComposition() {
    if (this.bodyCompositionData.length === 0) {
      return { weight: 0, fatMass: 0, muscleMass: 0, percentFat: 0, visceralFat: 0 };
    }
    const latest = this.bodyCompositionData[this.bodyCompositionData.length - 1];
    return {
      weight: latest.weight,
      fatMass: latest.fatMass,
      muscleMass: latest.muscleMass,
      percentFat: latest.percentFat,
      visceralFat: latest.visceralFat,
    };
  }

  getLatestBodyCompositionDate() {
    if (this.bodyCompositionData.length === 0) return '';
    const latestDate = new Date(this.bodyCompositionData[this.bodyCompositionData.length - 1].ts);
    return this.formatThaiDate(latestDate);
  }

  getDateRange() {
    if (this.bodyCompositionData.length === 0) return '';
    const firstDate = new Date(this.bodyCompositionData[1].ts);
    const lastDate = new Date(this.bodyCompositionData[this.bodyCompositionData.length - 1].ts);
    return `${this.formatThaiDate(firstDate)} - ${this.formatThaiDate(lastDate)}`;
  }

  formatThaiDate(date: Date) {
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  }

  openAddBodyCompositionDialog() {
    const dialogRef = this.dialog.open(AddBodyCompositionDialogComponent, {
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
  selector: 'app-add-body-composition-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>Add Body Composition</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-container">
        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="ts">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Weight (kg)</mat-label>
          <input matInput type="number" formControlName="weight">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fat %</mat-label>
          <input matInput type="number" formControlName="percentFat">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fat Mass (kg)</mat-label>
          <input matInput type="number" formControlName="fatMass">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Muscle Mass (kg)</mat-label>
          <input matInput type="number" formControlName="muscleMass">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Visceral Fat</mat-label>
          <input matInput type="number" formControlName="visceralFat">
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
      gap: 16px;
      padding-top: 10px;
    }
    .full-width {
      grid-column: span 2;
    }
    @media (max-width: 600px) {
      .form-container {
        grid-template-columns: 1fr;
      }
      .full-width {
        grid-column: span 1;
      }
    }
  `
})
export class AddBodyCompositionDialogComponent {
  private fb = inject(FormBuilder);
  private bodyCompositionService = inject(BodyCompositionService);
  private dialogRef = inject(MatDialogRef<AddBodyCompositionDialogComponent>);

  form: FormGroup = this.fb.group({
    ts: [new Date(), Validators.required],
    weight: [null, [Validators.required, Validators.min(0)]],
    percentFat: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
    fatMass: [null, [Validators.required, Validators.min(0)]],
    muscleMass: [null, [Validators.required, Validators.min(0)]],
    visceralFat: [null, [Validators.required, Validators.min(0)]],
    note: ['']
  });

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSave(): Promise<void> {
    if (this.form.valid) {
      const data = this.form.value;
      await this.bodyCompositionService.addBodyComposition(data);
      this.dialogRef.close(true);
    }
  }
}
