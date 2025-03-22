import { Component } from '@angular/core';
import { MaterialModule } from '../../shared/modules/material.module';

/* import for echart */
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsOption } from 'echarts/types/dist/shared';
import { CommonModule } from '@angular/common';

echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  CanvasRenderer,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
]);

@Component({
  selector: 'app-body-composition',
  standalone: true,
  imports: [CommonModule, MaterialModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: '<div class="chart-item" echarts [options]="chartOptions"></div>',
  styles: `
    .chart-item {
      width: 1280px;
      height: 680px;
    }
  `,
})
export class BodyCompositionPage {
  chartOptions = {
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: [150, 230, 224, 218, 135, 147, 260],
        type: 'line',
      },
    ],
  };
}
