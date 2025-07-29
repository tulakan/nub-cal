import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../shared/modules/material.module';

/* import for echart */
import { CommonModule } from '@angular/common';
import { BarChart, LineChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  CanvasRenderer,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  LegendComponent
]);

@Component({
  selector: 'app-body-composition',
  standalone: true,
  imports: [CommonModule, MaterialModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `
    <div class="container">
      <div class="main-sections">
        <!-- Body Composition Section -->
        <div class="body-composition-section">
          <!-- Latest Data Card -->
          <mat-card class="latest-data-card">
            <mat-card-header>
              <mat-card-title>Latest Body Composition</mat-card-title>
              <mat-card-subtitle>{{getLatestBodyCompositionDate()}}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item weight">
                  <div class="stat-label">Weight</div>
                  <div class="stat-value latest">{{getLatestBodyComposition().weight}} kg</div>
                </div>
                <div class="stat-item fat">
                  <div class="stat-label">Fat Mass</div>
                  <div class="stat-value latest">{{getLatestBodyComposition().fatMass}} kg</div>
                </div>
                <div class="stat-item muscle">
                  <div class="stat-label">Muscle Mass</div>
                  <div class="stat-value latest">{{getLatestBodyComposition().muscleMass}} kg</div>
                </div>
                <div class="stat-item fat-percentage">
                  <div class="stat-label">Fat %</div>
                  <div class="stat-value latest">{{getLatestBodyComposition().percentFat}}%</div>
                </div>
                <div class="stat-item visceral">
                  <div class="stat-label">Visceral Fat</div>
                  <div class="stat-value latest">{{getLatestBodyComposition().visceralFat}}</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Progress Card -->
          <mat-card class="progress-card">
            <mat-card-header>
              <mat-card-title>Body Composition Progress</mat-card-title>
              <mat-card-subtitle>{{getDateRange()}}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item weight">
                  <div class="stat-label">Weight</div>
                  <div class="stat-value" [class.positive]="getProgressDiff().weight > 0" [class.negative]="getProgressDiff().weight < 0">
                    {{getProgressDiff().weight > 0 ? '+' : ''}}{{getProgressDiff().weight}} kg
                  </div>
                </div>
                <div class="stat-item fat">
                  <div class="stat-label">Fat Mass</div>
                  <div class="stat-value" [class.positive]="getProgressDiff().fatMass > 0" [class.negative]="getProgressDiff().fatMass < 0">
                    {{getProgressDiff().fatMass > 0 ? '+' : ''}}{{getProgressDiff().fatMass}} kg
                  </div>
                </div>
                <div class="stat-item muscle">
                  <div class="stat-label">Muscle Mass</div>
                  <div class="stat-value" [class.positive]="getProgressDiff().muscleMass > 0" [class.negative]="getProgressDiff().muscleMass < 0">
                    {{getProgressDiff().muscleMass > 0 ? '+' : ''}}{{getProgressDiff().muscleMass}} kg
                  </div>
                </div>
                <div class="stat-item fat-percentage">
                  <div class="stat-label">Fat %</div>
                  <div class="stat-value" [class.positive]="getProgressDiff().percentFat > 0" [class.negative]="getProgressDiff().percentFat < 0">
                    {{getProgressDiff().percentFat > 0 ? '+' : ''}}{{getProgressDiff().percentFat}}%
                  </div>
                </div>
                <div class="stat-item visceral">
                  <div class="stat-label">Visceral Fat</div>
                  <div class="stat-value" [class.positive]="getProgressDiff().visceralFat > 0" [class.negative]="getProgressDiff().visceralFat < 0">
                    {{getProgressDiff().visceralFat > 0 ? '+' : ''}}{{getProgressDiff().visceralFat}}
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          <div class="chart-item" echarts [options]="chartOptions"></div>
        </div>

        <!-- Circumference Section -->
        <div class="circumference-section">
          <!-- Latest Data Card -->
          <mat-card class="latest-data-card">
            <mat-card-header>
              <mat-card-title>Latest Circumference</mat-card-title>
              <mat-card-subtitle>{{getLatestCircumferenceDate()}}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item chest">
                  <div class="stat-label">Chest</div>
                  <div class="stat-value latest">{{getLatestCircumference().chest}} cm</div>
                </div>
                <div class="stat-item arm">
                  <div class="stat-label">Arm (avg)</div>
                  <div class="stat-value latest">{{getLatestCircumference().arm}} cm</div>
                </div>
                <div class="stat-item waist">
                  <div class="stat-label">Waist</div>
                  <div class="stat-value latest">{{getLatestCircumference().waist}} cm</div>
                </div>
                <div class="stat-item hip">
                  <div class="stat-label">Hip</div>
                  <div class="stat-value latest">{{getLatestCircumference().hip}} cm</div>
                </div>
                <div class="stat-item thigh">
                  <div class="stat-label">Thigh (avg)</div>
                  <div class="stat-value latest">{{getLatestCircumference().thigh}} cm</div>
                </div>
                <div class="stat-item calf">
                  <div class="stat-label">Calf (avg)</div>
                  <div class="stat-value latest">{{getLatestCircumference().calf}} cm</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Progress Card -->
          <mat-card class="progress-card">
            <mat-card-header>
              <mat-card-title>Circumference Progress</mat-card-title>
              <mat-card-subtitle>{{getCircumferenceDateRange()}}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item chest">
                  <div class="stat-label">Chest</div>
                  <div class="stat-value" [class.positive]="getCircumferenceProgressDiff().chest > 0" [class.negative]="getCircumferenceProgressDiff().chest < 0">
                    {{getCircumferenceProgressDiff().chest > 0 ? '+' : ''}}{{getCircumferenceProgressDiff().chest}} cm
                  </div>
                </div>
                <div class="stat-item arm">
                  <div class="stat-label">Arm (avg)</div>
                  <div class="stat-value" [class.positive]="getCircumferenceProgressDiff().arm > 0" [class.negative]="getCircumferenceProgressDiff().arm < 0">
                    {{getCircumferenceProgressDiff().arm > 0 ? '+' : ''}}{{getCircumferenceProgressDiff().arm}} cm
                  </div>
                </div>
                <div class="stat-item waist">
                  <div class="stat-label">Waist</div>
                  <div class="stat-value" [class.positive]="getCircumferenceProgressDiff().waist > 0" [class.negative]="getCircumferenceProgressDiff().waist < 0">
                    {{getCircumferenceProgressDiff().waist > 0 ? '+' : ''}}{{getCircumferenceProgressDiff().waist}} cm
                  </div>
                </div>
                <div class="stat-item hip">
                  <div class="stat-label">Hip</div>
                  <div class="stat-value" [class.positive]="getCircumferenceProgressDiff().hip > 0" [class.negative]="getCircumferenceProgressDiff().hip < 0">
                    {{getCircumferenceProgressDiff().hip > 0 ? '+' : ''}}{{getCircumferenceProgressDiff().hip}} cm
                  </div>
                </div>
                <div class="stat-item thigh">
                  <div class="stat-label">Thigh (avg)</div>
                  <div class="stat-value" [class.positive]="getCircumferenceProgressDiff().thigh > 0" [class.negative]="getCircumferenceProgressDiff().thigh < 0">
                    {{getCircumferenceProgressDiff().thigh > 0 ? '+' : ''}}{{getCircumferenceProgressDiff().thigh}} cm
                  </div>
                </div>
                <div class="stat-item calf">
                  <div class="stat-label">Calf (avg)</div>
                  <div class="stat-value" [class.positive]="getCircumferenceProgressDiff().calf > 0" [class.negative]="getCircumferenceProgressDiff().calf < 0">
                    {{getCircumferenceProgressDiff().calf > 0 ? '+' : ''}}{{getCircumferenceProgressDiff().calf}} cm
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          <div class="chart-item" echarts [options]="circumferenceChartOptions"></div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .container {
      margin: 16px;
    }
    .main-sections {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    .body-composition-section,
    .circumference-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .progress-card {
      margin-bottom: 0;
      width: 100%;
    }
    .latest-data-card {
      margin-bottom: 0;
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .latest-data-card .mat-mdc-card-header .mat-mdc-card-title {
      color: white;
    }
    .latest-data-card .mat-mdc-card-header .mat-mdc-card-subtitle {
      color: rgba(255, 255, 255, 0.8);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .stat-item {
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      background-color: #f5f5f5;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 20px;
      font-weight: bold;
    }
    .stat-value.positive {
      color: #10b981;
    }
    .stat-value.negative {
      color: #ef4444;
    }
    .stat-value.latest {
      color: black;
      font-size: 24px;
    }
    .chart-item {
      width: 100%;
      height: 480px;
    }
    
    /* Responsive design for smaller screens */
    @media (max-width: 1400px) {
      .main-sections {
        flex-direction: column;
      }
      .chart-item {
        height: 500px;
      }
    }
  `,
})
export class BodyCompositionPage implements OnInit, AfterViewInit {

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  bodyCompositionData: any[] = [
    {
      ts: new Date('2024-10-28'),
      weight: 122.1,
      percentFat: 39.6,
      fatMass: 48.4,
      muscleMass: 69.9,
      visceralFat: 19,
      note: 'VIVE Fitness มาที่ตึก EAST Park'
    },
    {
      ts: new Date('2025-01-06'),
      weight: 122.3,
      percentFat: 39.6,
      fatMass: 48.4,
      muscleMass: 70.1,
      visceralFat: 19,
      note: 'train ครั้งแรก',
    },
    {
      ts: new Date('2025-01-31'),
      weight: 123,
      percentFat: 38.2,
      fatMass: 47,
      muscleMass: 72.1,
      visceralFat: 20,
      note: 'เดือนแรกหลังโปรแกรมโค้ชชมพู่ MON:Body Pump / TUE:LEG / WED:Fat Killer / THU:Chest & Back / FRI:Shoulder & Arm',
    },
    {
      ts: new Date('2025-03-13'),
      weight: 122.1,
      percentFat: 37.8,
      fatMass: 46.2,
      muscleMass: 72,
      visceralFat: 19,
      note: 'ก่อนเริ่ม Train กับกานต์',
    },
    {
      ts: new Date('2025-03-30'),
      weight: 122.9,
      percentFat: 38.5,
      fatMass: 47.3,
      muscleMass: 71.7,
      visceralFat: 20,
      note: 'ชั่งสิ้นเดือน',
    },
    {
      ts: new Date('2025-04-22'),
      weight: 121.2,
      percentFat: 37,
      fatMass: 44.8,
      muscleMass: 72.5,
      visceralFat: 19,
      note: 'หลังจาก Train กับกานต์ 1 เดือน',
    },
    {
      ts: new Date('2025-05-20'),
      weight: 117.8,
      percentFat: 36.5,
      fatMass: 43,
      muscleMass: 71,
      visceralFat: 19,
      note: 'Train กับกานต์ 2 เดือน ครบ 30 ชั่วโมง',
    },
    {
      ts: new Date('2025-05-31'),
      weight: 116.4,
      percentFat: 37.5,
      fatMass: 43.6,
      muscleMass: 69.1,
      visceralFat: 18,
      note: 'ชั่งสิ้นเดือน',
    },
    {
      ts: new Date('2025-06-14'),
      weight: 116.8,
      percentFat: 37.1,
      fatMass: 43.3,
      muscleMass: 69.7,
      visceralFat: 19,
      note: 'ชั่งกลางเดือน',
    },
    {
      ts: new Date('2025-06-28'),
      weight: 117.6,
      percentFat: 37.7,
      fatMass: 44.3,
      muscleMass: 69.5,
      visceralFat: 19,
      note: 'ชั่งสิ้นเดือน',
    },
    {
      ts: new Date('2025-07-12'),
      weight: 117.9,
      percentFat: 37.4,
      fatMass: 44.1,
      muscleMass: 70,
      visceralFat: 19,
      note: 'ชั่งกลางเดือน',
    },
    {
      ts: new Date('2025-07-27'),
      weight: 118.6,
      percentFat: 37.5,
      fatMass: 44.5,
      muscleMass: 70.3,
      visceralFat: 19,
      note: 'ชั่งปลายเดือน',
    },

  ]


  circumferenceData: any[] = [
    {
      ts: new Date('2025-01-11'),
      chest: 121.9,
      leftArm: 41,
      rightArm: 41,
      waist: 123.5,
      hip: 120.5,
      leftThigh: 75,
      rightThigh: 75,
      leftCalf: 48,
      rightCalf: 48,
      note: 'เริ่มต้นวัดรอบร่างกาย',
    },
    {
      ts: new Date('2025-01-25'),
      chest: 121,
      leftArm: 41,
      rightArm: 41,
      waist: 122,
      hip: 120.5,
      leftThigh: 76,
      rightThigh: 76,
      leftCalf: 49,
      rightCalf: 49,
      note: 'เริ่มต้นวัดรอบร่างกาย',
    },
    {
      ts: new Date('2025-02-01'),
      chest: 121,
      leftArm: 43,
      rightArm: 43,
      waist: 119,
      hip: 122,
      leftThigh: 76,
      rightThigh: 75,
      leftCalf: 49.1,
      rightCalf: 49,
      note: 'เริ่มต้นวัดรอบร่างกาย',
    },
    {
      ts: new Date('2025-02-28'),
      chest: 121.5,
      leftArm: 42,
      rightArm: 41,
      waist: 120.5,
      hip: 123,
      leftThigh: 75,
      rightThigh: 75,
      leftCalf: 49,
      rightCalf: 49,
      note: 'เริ่มต้นวัดรอบร่างกาย',
    },
    {
      ts: new Date('2025-03-31'),
      chest: 121.8,
      leftArm: 41,
      rightArm: 39.5,
      waist: 120.4,
      hip: 124.5,
      leftThigh: 78,
      rightThigh: 76,
      leftCalf: 49,
      rightCalf: 49,
      note: 'เริ่มต้นวัดรอบร่างกาย',
    },
    {
      ts: new Date('2025-05-03'),
      chest: 118.5,
      leftArm: 41,
      rightArm: 41,
      waist: 119.8,
      hip: 121,
      leftThigh: 76,
      rightThigh: 76,
      leftCalf: 48,
      rightCalf: 48,
      note: 'เริ่มต้นวัดรอบร่างกาย',
    },
    {
      ts: new Date('2025-06-07'),
      chest: 120.3,
      leftArm: 41,
      rightArm: 41,
      waist: 120.2,
      hip: 121,
      leftThigh: 76,
      rightThigh: 76,
      leftCalf: 48,
      rightCalf: 48,
      note: 'เริ่มต้นวัดรอบร่างกาย',
    },
    {
      ts: new Date('2025-07-20'),
      chest: 119.5,
      leftArm: 41.1,
      rightArm: 40.5,
      waist: 118,
      hip: 122,
      leftThigh: 74,
      rightThigh: 74,
      leftCalf: 48.5,
      rightCalf: 48,
      note: 'เริ่มต้นวัดรอบร่างกาย',
    },
  ]

  circumferenceChartOptions: any = {
    title: {
      text: 'Body Circumference Progress',
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        // Format date in Thai
        const date = new Date(params[0].axisValue);
        const thaiMonths = [
          'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543; // Convert to Buddhist Era
        const thaiDate = `${day} ${month} ${year}`;

        let result = thaiDate + '<br/>';
        params.forEach((param: any) => {
          result += param.marker + param.seriesName + ': ' + param.value[1] + ' cm<br/>';
        });
        return result;
      }
    },
    legend: {
      data: ['Chest', 'Waist', 'Hip', 'Arm (avg)', 'Thigh (avg)', 'Calf (avg)'],
      // top: 'bottom'
    },
    grid: {
      top: 40,
      left: 40,
      right: 40,
      bottom: 32,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: function (value: number) {
          const date = new Date(value);
          const thaiMonths = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
          ];
          const day = date.getDate();
          const month = thaiMonths[date.getMonth()];
          const year = date.getFullYear() + 543; // Convert to Buddhist Era
          return `${day} ${month} ${year}`;
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Circumference (cm)',
      nameLocation: 'middle',
      nameGap: 50,
      min: function (value: any) {
        return Math.floor(value.min - 5);
      }
    },
    series: [
      {
        name: 'Chest',
        type: 'line',
        data: this.circumferenceData.map(item => [item.ts, item.chest]),
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: 'Waist',
        type: 'line',
        data: this.circumferenceData.map(item => [item.ts, item.waist]),
        lineStyle: {
          color: '#ef4444',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: 'Hip',
        type: 'line',
        data: this.circumferenceData.map(item => [item.ts, item.hip]),
        lineStyle: {
          color: '#10b981',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: 'Arm (avg)',
        type: 'line',
        data: this.circumferenceData.map(item => [item.ts, (item.leftArm + item.rightArm) / 2]),
        lineStyle: {
          color: '#f59e0b',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: 'Thigh (avg)',
        type: 'line',
        data: this.circumferenceData.map(item => [item.ts, (item.leftThigh + item.rightThigh) / 2]),
        lineStyle: {
          color: '#8b5cf6',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: 'Calf (avg)',
        type: 'line',
        data: this.circumferenceData.map(item => [item.ts, (item.leftCalf + item.rightCalf) / 2]),
        lineStyle: {
          color: '#ec4899',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ],
  };



  // ...existing code...
  chartOptions: any = {

    title: {
      text: 'Body Composition Progress',
      // left: 'center',
      // textStyle: {
      //   fontSize: 18,
      //   fontWeight: 'bold'
      // },
      // top: 10
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {

        // Format date in Thai
        const date = new Date(params[0].axisValue);
        const thaiMonths = [
          'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543; // Convert to Buddhist Era
        const thaiDate = `${day} ${month} ${year}`;

        let result = thaiDate + '<br/>';
        params.forEach((param: any) => {
          result += param.marker + param.seriesName + ': ' + param.value[1] + '<br/>';
        });
        return result;
      }
    },
    legend: {
      data: ['Weight (kg)', 'Fat Mass (kg)', 'Muscle Mass (kg)'],
    },
    grid: {
      top: 40,
      left: 40,
      right: 40,
      bottom: 32,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: function (value: number) {
          const date = new Date(value);
          const thaiMonths = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
          ];
          const day = date.getDate();
          const month = thaiMonths[date.getMonth()];
          const year = date.getFullYear() + 543; // Convert to Buddhist Era
          return `${day} ${month} ${year}`;
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Weight (kg)',
      nameLocation: 'middle',
      nameGap: 50,
      min: function (value: any) {
        return Math.floor(value.min - 5);
      }
    },
    series: [
      {
        name: 'Weight (kg)',
        type: 'line',
        data: this.bodyCompositionData.map(item => [item.ts, item.weight]),
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: 'Fat Mass (kg)',
        type: 'line',
        data: this.bodyCompositionData.map(item => [item.ts, item.fatMass]),
        lineStyle: {
          color: '#ef4444',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: 'Muscle Mass (kg)',
        type: 'line',
        data: this.bodyCompositionData.map(item => [item.ts, item.muscleMass]),
        lineStyle: {
          color: '#10b981',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ],
  };

  getProgressDiff() {
    if (this.bodyCompositionData.length < 2) {
      return {
        weight: 0,
        fatMass: 0,
        muscleMass: 0,
        percentFat: 0,
        visceralFat: 0
      };
    }

    const firstRecord = this.bodyCompositionData[1];
    const lastRecord = this.bodyCompositionData[this.bodyCompositionData.length - 1];

    return {
      weight: Math.round((lastRecord.weight - firstRecord.weight) * 10) / 10,
      fatMass: Math.round((lastRecord.fatMass - firstRecord.fatMass) * 10) / 10,
      muscleMass: Math.round((lastRecord.muscleMass - firstRecord.muscleMass) * 10) / 10,
      percentFat: Math.round((lastRecord.percentFat - firstRecord.percentFat) * 10) / 10,
      visceralFat: lastRecord.visceralFat - firstRecord.visceralFat
    };
  }

  getLatestBodyComposition() {
    if (this.bodyCompositionData.length === 0) {
      return {
        weight: 0,
        fatMass: 0,
        muscleMass: 0,
        percentFat: 0,
        visceralFat: 0
      };
    }

    const latest = this.bodyCompositionData[this.bodyCompositionData.length - 1];
    return {
      weight: latest.weight,
      fatMass: latest.fatMass,
      muscleMass: latest.muscleMass,
      percentFat: latest.percentFat,
      visceralFat: latest.visceralFat
    };
  }

  getLatestBodyCompositionDate() {
    if (this.bodyCompositionData.length === 0) {
      return '';
    }

    const latestDate = new Date(this.bodyCompositionData[this.bodyCompositionData.length - 1].ts);
    return this.formatThaiDate(latestDate);
  }

  getDateRange() {
    if (this.bodyCompositionData.length === 0) {
      return '';
    }

    const firstDate = new Date(this.bodyCompositionData[1].ts);
    const lastDate = new Date(this.bodyCompositionData[this.bodyCompositionData.length - 1].ts);

    return `${this.formatThaiDate(firstDate)} - ${this.formatThaiDate(lastDate)}`;
  }

  formatThaiDate(date: Date) {
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  }

  getCircumferenceProgressDiff() {
    if (this.circumferenceData.length < 2) {
      return {
        chest: 0,
        arm: 0,
        waist: 0,
        hip: 0,
        thigh: 0,
        calf: 0
      };
    }

    const firstRecord = this.circumferenceData[0];
    const lastRecord = this.circumferenceData[this.circumferenceData.length - 1];

    return {
      chest: Math.round((lastRecord.chest - firstRecord.chest) * 10) / 10,
      arm: Math.round((((lastRecord.leftArm + lastRecord.rightArm) / 2) - ((firstRecord.leftArm + firstRecord.rightArm) / 2)) * 10) / 10,
      waist: Math.round((lastRecord.waist - firstRecord.waist) * 10) / 10,
      hip: Math.round((lastRecord.hip - firstRecord.hip) * 10) / 10,
      thigh: Math.round((((lastRecord.leftThigh + lastRecord.rightThigh) / 2) - ((firstRecord.leftThigh + firstRecord.rightThigh) / 2)) * 10) / 10,
      calf: Math.round((((lastRecord.leftCalf + lastRecord.rightCalf) / 2) - ((firstRecord.leftCalf + firstRecord.rightCalf) / 2)) * 10) / 10
    };
  }

  getLatestCircumference() {
    if (this.circumferenceData.length === 0) {
      return {
        chest: 0,
        arm: 0,
        waist: 0,
        hip: 0,
        thigh: 0,
        calf: 0
      };
    }

    const latest = this.circumferenceData[this.circumferenceData.length - 1];
    return {
      chest: latest.chest,
      arm: Math.round(((latest.leftArm + latest.rightArm) / 2) * 10) / 10,
      waist: latest.waist,
      hip: latest.hip,
      thigh: Math.round(((latest.leftThigh + latest.rightThigh) / 2) * 10) / 10,
      calf: Math.round(((latest.leftCalf + latest.rightCalf) / 2) * 10) / 10
    };
  }

  getLatestCircumferenceDate() {
    if (this.circumferenceData.length === 0) {
      return '';
    }

    const latestDate = new Date(this.circumferenceData[this.circumferenceData.length - 1].ts);
    return this.formatThaiDate(latestDate);
  }

  getCircumferenceDateRange() {
    if (this.circumferenceData.length === 0) {
      return '';
    }

    const firstDate = new Date(this.circumferenceData[0].ts);
    const lastDate = new Date(this.circumferenceData[this.circumferenceData.length - 1].ts);

    return `${this.formatThaiDate(firstDate)} - ${this.formatThaiDate(lastDate)}`;
  }

  // ...existing code...
}
