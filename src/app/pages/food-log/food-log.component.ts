import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { AddFoodComponent } from '../../dialogs/add-food/add-food.component';
import { EditLoggedComponent } from '../../dialogs/edit-logged/edit-logged.component';
import { TargetDialogComponent } from '../../dialogs/target-dialog/target-dialog.component';
import { ConfirmService } from '../../shared/components/confirm-dialog.component';
import { MacroChipsComponent } from '../../shared/components/macro-chips.component';
import { MacroSummaryComponent } from '../../shared/components/macro-summary.component';
import { EmptyStateComponent } from '../../shared/components/primitives';
import { SheetService } from '../../shared/components/sheet.service';
import { SwipeRowComponent } from '../../shared/components/swipe-row.component';
import { UndoService } from '../../shared/components/undo.service';
import { LoggedFood } from '../../shared/interface/nutrition.interface';
import {
  KcalPipe,
  MacroPipe,
  formatThaiDate,
} from '../../shared/pipes/format.pipes';
import { ShellService } from '../../shared/services/shell.service';
import { Macros, sumNutrition } from '../../shared/utils/nutrition';
import { FoodLogStore } from '../../stores/food-log.store';
import { MenuPlanStore } from '../../stores/menu-plan.store';

type Row =
  | { kind: 'item'; key: string; item: LoggedFood }
  | {
      kind: 'group';
      key: string;
      name: string;
      items: LoggedFood[];
      nutrition: Macros;
    };

@Component({
  selector: 'app-food-log',
  standalone: true,
  imports: [
    MacroChipsComponent,
    MatIconModule,
    MatMenuModule,
    SwipeRowComponent,
    MacroSummaryComponent,
    EmptyStateComponent,
    KcalPipe,
    MacroPipe,
  ],
  templateUrl: './food-log.component.html',
  styleUrls: ['./food-log.component.scss'],
})
export class FoodLogPage implements OnInit, OnDestroy {
  private sheets = inject(SheetService);
  private undo = inject(UndoService);
  private confirm = inject(ConfirmService);
  private shell = inject(ShellService);
  private route = inject(ActivatedRoute);
  private plan = inject(MenuPlanStore);
  log = inject(FoodLogStore);

  expanded = signal<Set<string>>(new Set());

  rows = computed<Row[]>(() => {
    const rows: Row[] = [];
    for (const item of this.log.items()) {
      const g = item.group;
      const last = rows[rows.length - 1];
      if (g && last?.kind === 'group' && last.key === g.id) {
        last.items.push(item);
        last.nutrition = sumNutrition(
          last.items.map(i => i.calculatedNutrition)
        );
      } else if (g) {
        rows.push({
          kind: 'group',
          key: g.id,
          name: g.name,
          items: [item],
          nutrition: { ...item.calculatedNutrition },
        });
      } else {
        rows.push({ kind: 'item', key: item.id!, item });
      }
    }
    return rows;
  });

  ngOnInit() {
    this.plan.start(); // foods/menus for the add sheet
    this.log.refreshDay();
    this.shell.set(
      [
        {
          icon: 'settings',
          ariaLabel: 'Settings',
          onClick: () => this.openSettings(),
        },
      ],
      formatThaiDate(new Date(), 'day')
    );
    if (this.route.snapshot.queryParamMap.get('add')) {
      setTimeout(() => this.openAdd());
    }
  }

  ngOnDestroy() {
    this.shell.clear();
  }

  openAdd() {
    this.sheets.open(AddFoodComponent);
  }

  openSettings() {
    this.sheets.open(TargetDialogComponent);
  }

  edit(item: LoggedFood) {
    if (item.id) this.sheets.open(EditLoggedComponent, { id: item.id });
  }

  removeItem(item: LoggedFood) {
    if (!item.id) return;
    const removed = this.log.remove([item.id]);
    this.undo.undoable(`${item.food.name} removed`, () =>
      this.log.restore(removed)
    );
  }

  removeGroup(row: Extract<Row, { kind: 'group' }>) {
    const removed = this.log.remove(row.items.map(i => i.id!));
    this.undo.undoable(`${row.name} removed`, () => this.log.restore(removed));
  }

  toggle(key: string) {
    this.expanded.update(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async clearAll() {
    if (!this.log.items().length) return;
    const ok = await this.confirm.ask({
      title: "Clear today's log?",
      message: 'All foods logged today will be removed.',
      confirmLabel: 'Clear',
      destructive: true,
    });
    if (!ok) return;
    const prev = this.log.clear();
    this.undo.undoable("Today's log cleared", () => this.log.setAll(prev));
  }
}
