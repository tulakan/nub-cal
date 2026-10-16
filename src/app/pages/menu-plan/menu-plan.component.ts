import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { SelectMenuDialogComponent } from '../../dialogs/select-menu-dialog/select-menu-dialog.component';
import { ConfirmService } from '../../shared/components/confirm-dialog.component';
import { MacroChipsComponent } from '../../shared/components/macro-chips.component';
import { MacroSummaryComponent } from '../../shared/components/macro-summary.component';
import {
  ChipsComponent,
  EmptyStateComponent,
  SegmentedComponent,
  SkeletonComponent,
} from '../../shared/components/primitives';
import { QtyInputComponent } from '../../shared/components/qty-input.component';
import { SheetService } from '../../shared/components/sheet.service';
import { SwipeRowComponent } from '../../shared/components/swipe-row.component';
import { UndoService } from '../../shared/components/undo.service';
import { Food } from '../../shared/interface/food.interface';
import { Menu } from '../../shared/interface/menu.interface';
import { PlannedMenu } from '../../shared/interface/plan.interface';
import { KcalPipe, MacroPipe } from '../../shared/pipes/format.pipes';
import { MenuService } from '../../shared/services/menu.service';
import { calcNutrition } from '../../shared/utils/nutrition';
import { FoodLogStore } from '../../stores/food-log.store';
import { MenuPlanStore } from '../../stores/menu-plan.store';

const SEG_KEY = 'plan-segment';
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

@Component({
  selector: 'app-menu-plan',
  standalone: true,
  imports: [
    MacroChipsComponent,
    MatIconModule,
    MatMenuModule,
    SegmentedComponent,
    ChipsComponent,
    EmptyStateComponent,
    SkeletonComponent,
    SwipeRowComponent,
    QtyInputComponent,
    MacroSummaryComponent,
    KcalPipe,
    MacroPipe,
  ],
  templateUrl: './menu-plan.component.html',
  styleUrls: ['./menu-plan.component.scss'],
})
export class MenuPlanComponent implements OnInit {
  private router = inject(Router);
  private sheets = inject(SheetService);
  private undo = inject(UndoService);
  private confirm = inject(ConfirmService);
  private menuService = inject(MenuService);
  store = inject(MenuPlanStore);
  log = inject(FoodLogStore);

  segments = [
    { value: 'plan', label: 'Plan' },
    { value: 'menus', label: 'Menus' },
  ];
  scaleOptions = [
    { value: '0.5', label: '½×' },
    { value: '1', label: '1×' },
    { value: '1.5', label: '1½×' },
    { value: '2', label: '2×' },
  ];

  segment = signal(this.readSegment());
  query = signal('');

  filteredMenus = computed(() => {
    const q = norm(this.query().trim());
    const all = this.store.menus();
    return q ? all.filter(m => norm(m.name).includes(q)) : all;
  });

  pending = computed(() => this.store.plan().filter(p => !p.loggedAt));

  ngOnInit() {
    this.store.start();
    this.log.refreshDay();
  }

  setSegment(v: string) {
    this.segment.set(v);
    try {
      localStorage.setItem(SEG_KEY, v);
    } catch {}
  }

  private readSegment(): string {
    try {
      return localStorage.getItem(SEG_KEY) === 'menus' ? 'menus' : 'plan';
    } catch {
      return 'plan';
    }
  }

  foodOf(foodId: string): Food | undefined {
    return this.store.foodsById().get(foodId);
  }

  kcalOf(ing: { foodId: string; quantity: number }): number {
    return calcNutrition(this.foodOf(ing.foodId), ing.quantity).kcal;
  }

  openPicker() {
    this.sheets.open(SelectMenuDialogComponent);
  }

  newMenu() {
    this.router.navigate(['/plan/menu/new']);
  }

  editMenu(id: string | undefined) {
    if (id) this.router.navigate(['/plan/menu', id]);
  }

  addToPlan(menu: Menu) {
    const id = this.store.addToPlan(menu);
    this.undo.undoable(`${menu.name} added to plan`, () =>
      this.store.removeInstance(id)
    );
  }

  async deleteMenu(menu: Menu) {
    if (!menu.id) return;
    const ok = await this.confirm.ask({
      title: `Delete "${menu.name}"?`,
      message: 'This removes the saved menu. Past logs are not affected.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) {
      await this.menuService.deleteMenu(menu.id);
      this.undo.notify(`${menu.name} deleted`);
    }
  }

  removeInstance(p: PlannedMenu) {
    const r = this.store.removeInstance(p.instanceId);
    if (r)
      this.undo.undoable(`${p.name} removed`, () =>
        this.store.restoreInstance(r)
      );
  }

  removeIngredient(p: PlannedMenu, index: number) {
    const prev = this.store.plan();
    if (p.ingredients.length === 1) {
      this.removeInstance(p);
      return;
    }
    this.store.removeIngredient(p.instanceId, index);
    this.undo.undoable('Item removed', () => this.store.setPlan(prev));
  }

  async logInstance(p: PlannedMenu) {
    if (p.loggedAt) {
      const again = await this.confirm.ask({
        title: 'Log again?',
        message: `${p.name} is already logged today.`,
        confirmLabel: 'Log again',
      });
      if (!again) return;
    }
    this.logMany([p]);
  }

  logAll() {
    this.logMany(this.pending());
  }

  private logMany(items: PlannedMenu[]) {
    if (!items.length) return;
    const prevLogged = new Map(items.map(p => [p.instanceId, p.loggedAt]));
    const ids: string[] = [];
    let skipped = 0;
    let kcal = 0;
    for (const p of items) {
      const r = this.log.logMenu(
        { menuId: p.menuId, name: p.name, ingredients: p.ingredients },
        this.store.foodsById()
      );
      ids.push(...r.ids);
      skipped += r.skipped;
      kcal += this.store.instanceNutrition(p).kcal;
    }
    this.store.markLogged(items.map(p => p.instanceId));
    const note = skipped ? ` · ${skipped} skipped (food deleted)` : '';
    this.undo.undoable(
      `Logged ${items.length} ${items.length === 1 ? 'menu' : 'menus'} · ${Math.round(kcal)} kcal${note}`,
      () => {
        this.log.remove(ids);
        prevLogged.forEach((at, id) => this.store.markLogged([id], at));
      }
    );
  }

  clearPlan() {
    const prev = this.store.clearPlan();
    this.undo.undoable('Plan cleared', () => this.store.setPlan(prev));
  }
}
