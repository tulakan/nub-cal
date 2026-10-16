import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { AddEntryComponent } from '../../dialogs/add-entry/add-entry.component';
import {
  ChipsComponent,
  EmptyStateComponent,
  SegmentedComponent,
  SkeletonComponent,
  StatTileComponent,
} from '../../shared/components/primitives';
import { SheetService } from '../../shared/components/sheet.service';
import { formatThaiDate } from '../../shared/pipes/format.pipes';
import { BodyCompositionService } from '../../shared/services/body-composition.service';

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

type Kind = 'body' | 'measure';
type Dir = 'up' | 'down' | 'none';
type Row = Record<string, any> & { ts: Date };

interface Metric {
  key: string;
  label: string;
  unit: string;
  good: Dir;
  /** Value of this metric for a row. */
  get: (r: Row) => number;
}

const avg = (a: number, b: number) => Math.round(((a + b) / 2) * 10) / 10;
const field = (key: string) => (r: Row) => r[key] as number;

const METRICS: Record<Kind, Metric[]> = {
  body: [
    {
      key: 'weight',
      label: 'Weight',
      unit: 'kg',
      good: 'down',
      get: field('weight'),
    },
    {
      key: 'percentFat',
      label: 'Fat',
      unit: '%',
      good: 'down',
      get: field('percentFat'),
    },
    {
      key: 'fatMass',
      label: 'Fat mass',
      unit: 'kg',
      good: 'down',
      get: field('fatMass'),
    },
    {
      key: 'muscleMass',
      label: 'Muscle',
      unit: 'kg',
      good: 'up',
      get: field('muscleMass'),
    },
    {
      key: 'visceralFat',
      label: 'Visceral',
      unit: '',
      good: 'down',
      get: field('visceralFat'),
    },
  ],
  measure: [
    {
      key: 'waist',
      label: 'Waist',
      unit: 'cm',
      good: 'down',
      get: field('waist'),
    },
    { key: 'hip', label: 'Hip', unit: 'cm', good: 'down', get: field('hip') },
    {
      key: 'chest',
      label: 'Chest',
      unit: 'cm',
      good: 'none',
      get: field('chest'),
    },
    {
      key: 'arm',
      label: 'Arm',
      unit: 'cm',
      good: 'none',
      get: r => avg(r['leftArm'], r['rightArm']),
    },
    {
      key: 'thigh',
      label: 'Thigh',
      unit: 'cm',
      good: 'down',
      get: r => avg(r['leftThigh'], r['rightThigh']),
    },
    {
      key: 'calf',
      label: 'Calf',
      unit: 'cm',
      good: 'none',
      get: r => avg(r['leftCalf'], r['rightCalf']),
    },
  ],
};

const RANGE_DAYS: Record<string, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  All: 0,
};
const round1 = (n: number) => Math.round(n * 10) / 10;

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    MatIconModule,
    NgxEchartsDirective,
    SegmentedComponent,
    ChipsComponent,
    StatTileComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
})
export class ProgressPage implements OnInit {
  private svc = inject(BodyCompositionService);
  private sheets = inject(SheetService);

  segments = [
    { value: 'body', label: 'Body' },
    { value: 'measure', label: 'Measurements' },
  ];
  ranges = Object.keys(RANGE_DAYS).map(r => ({ value: r, label: r }));
  formatDate = formatThaiDate;
  tints = ['primary', 'protein', 'carb', 'fat', 'lilac', 'peach'] as const;

  kind = signal<Kind>('body');
  metricKey = signal<Record<Kind, string>>({
    body: 'weight',
    measure: 'waist',
  });
  range = signal('3M');
  loading = signal(true);
  data = signal<Record<Kind, Row[]>>({ body: [], measure: [] });
  historyOpen = signal<number | null>(null);
  historyLimit = signal(10);

  rows = computed(() => this.data()[this.kind()]);
  metrics = computed(() => METRICS[this.kind()]);
  metric = computed(
    () =>
      this.metrics().find(m => m.key === this.metricKey()[this.kind()]) ??
      this.metrics()[0]
  );

  latest = computed(() => this.rows().at(-1) ?? null);
  previous = computed(() => this.rows().at(-2) ?? null);
  first = computed(() => this.rows().at(0) ?? null);

  heroValue = computed(() =>
    this.latest() ? this.metric().get(this.latest()!) : null
  );
  heroDelta = computed(() => this.delta(this.metric(), this.previous()));
  sinceFirst = computed(() => {
    const l = this.latest();
    const f = this.first();
    if (!l || !f || l === f) return null;
    return round1(this.metric().get(l) - this.metric().get(f));
  });

  history = computed(() => [...this.rows()].reverse());

  /** Points in the selected range, counted back from the latest entry (not today). */
  chartPoints = computed(() => {
    const m = this.metric();
    const rows = this.rows();
    const days = RANGE_DAYS[this.range()];
    const latest = rows.at(-1)?.ts.getTime() ?? 0;
    const cutoff = days ? latest - days * 86400000 : 0;
    return rows
      .filter(r => r.ts.getTime() >= cutoff)
      .map(r => [r.ts.getTime(), m.get(r)] as [number, number])
      .filter(p => Number.isFinite(p[1]));
  });

  chartOptions = computed(() => {
    const m = this.metric();
    const pts = this.chartPoints();
    return {
      animation: false,
      grid: { top: 12, left: 36, right: 12, bottom: 24 },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (p: any) =>
          `${formatThaiDate(new Date(p[0].value[0]))}<br/>${m.label}: ${p[0].value[1]}${m.unit ? ' ' + m.unit : ''}`,
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          color: '#666',
          fontSize: 11,
          formatter: (v: number) => formatThaiDate(new Date(v)).slice(0, -5),
        },
        axisLine: { lineStyle: { color: '#e0e0e0' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: '#666', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f5f5f5' } },
      },
      series: [
        {
          type: 'line',
          data: pts,
          showSymbol: pts.length < 40,
          symbolSize: 5,
          lineStyle: { color: '#2f9e5f', width: 3 },
          itemStyle: { color: '#2f9e5f' },
          areaStyle: { color: 'rgba(110,207,146,0.22)' },
        },
      ],
    };
  });

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    const [body, measure] = await Promise.all([
      this.svc.getBodyComposition(),
      this.svc.getCircumference(),
    ]);
    this.data.set({ body: body as Row[], measure: measure as Row[] });
    this.loading.set(false);
  }

  setKind(v: string) {
    this.kind.set(v as Kind);
    this.historyOpen.set(null);
    this.historyLimit.set(10);
  }

  selectMetric(key: string) {
    this.metricKey.update(m => ({ ...m, [this.kind()]: key }));
  }

  tileValue(m: Metric): number | null {
    const l = this.latest();
    return l ? m.get(l) : null;
  }

  tileDelta(m: Metric): number | null {
    return this.delta(m, this.previous());
  }

  private delta(m: Metric, prev: Row | null): number | null {
    const l = this.latest();
    if (!l || !prev) return null;
    return round1(m.get(l) - m.get(prev));
  }

  summary(r: Row): string {
    return this.kind() === 'body'
      ? `${r['weight']} kg · ${r['percentFat']}%`
      : `waist ${r['waist']} · hip ${r['hip']}`;
  }

  details(r: Row): { label: string; value: string }[] {
    const keys =
      this.kind() === 'body'
        ? ['weight', 'percentFat', 'fatMass', 'muscleMass', 'visceralFat']
        : [
            'chest',
            'waist',
            'hip',
            'leftArm',
            'rightArm',
            'leftThigh',
            'rightThigh',
            'leftCalf',
            'rightCalf',
          ];
    return keys.map(k => ({ label: k, value: String(r[k]) }));
  }

  add() {
    this.sheets
      .open<AddEntryComponent, boolean>(AddEntryComponent, {
        kind: this.kind(),
        last: this.latest(),
      })
      .afterDismissed()
      .subscribe(saved => saved && this.load());
  }
}
