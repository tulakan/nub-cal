import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';
import { Food } from '../shared/interface/food.interface';
import { Menu } from '../shared/interface/menu.interface';
import { PlannedMenu } from '../shared/interface/plan.interface';
import { FoodService } from '../shared/services/food.service';
import { MenuService } from '../shared/services/menu.service';
import { SessionService } from '../shared/services/session.service';
import { localDateKey, newId } from '../shared/utils/date-key';
import {
  Macros,
  ingredientsNutrition,
  sumNutrition,
} from '../shared/utils/nutrition';

const PLAN_PREFIX = 'plan:';
const KEEP_DAYS = 30;

/**
 * Single realtime subscription each for foods and menus (app lifetime),
 * plus today's persisted plan.
 */
@Injectable({ providedIn: 'root' })
export class MenuPlanStore {
  private foodService = inject(FoodService);
  private menuService = inject(MenuService);

  readonly foods = signal<Food[]>([]);
  readonly rawMenus = signal<Menu[]>([]);
  readonly foodsLoaded = signal(false);
  readonly menusLoaded = signal(false);
  readonly loadError = signal(false);
  readonly plan = signal<PlannedMenu[]>([]);

  readonly loading = computed(() => !this.foodsLoaded() || !this.menusLoaded());
  readonly foodsById = computed(
    () => new Map(this.foods().map(f => [f.id, f] as [string, Food]))
  );
  readonly menus = computed(() =>
    [...this.rawMenus()].sort((a, b) => {
      const ta = a.lastUsedAt ?? a.updatedAt ?? 0;
      const tb = b.lastUsedAt ?? b.updatedAt ?? 0;
      return tb - ta || a.name.localeCompare(b.name);
    })
  );
  readonly menusById = computed(
    () => new Map(this.rawMenus().map(m => [m.id!, m] as [string, Menu]))
  );

  readonly planTotals = computed<Macros>(() => {
    const byId = this.foodsById();
    return sumNutrition(
      this.plan().map(p => ingredientsNutrition(p.ingredients, byId))
    );
  });
  /** Totals of instances not yet logged. */
  readonly pendingTotals = computed<Macros>(() => {
    const byId = this.foodsById();
    return sumNutrition(
      this.plan()
        .filter(p => !p.loggedAt)
        .map(p => ingredientsNutrition(p.ingredients, byId))
    );
  });

  private session = inject(SessionService);
  private uid: string | null = null;
  private dayKey = localDateKey();
  private unsubs: Unsubscribe[] = [];

  constructor() {
    // Follow the signed-in user: reset state and resubscribe on account change.
    effect(
      () => {
        const uid = this.session.uid();
        this.unsubs.forEach(u => u());
        this.unsubs = [];
        this.uid = uid;
        this.foods.set([]);
        this.rawMenus.set([]);
        this.plan.set([]);
        this.foodsLoaded.set(false);
        this.menusLoaded.set(false);
        this.loadError.set(false);
        if (!uid) return;
        this.prune();
        this.loadPlan();
        // On error, stop showing skeletons and fall back to empty states.
        this.unsubs.push(
          this.foodService.listen(
            foods => {
              this.foods.set(foods);
              this.foodsLoaded.set(true);
            },
            () => {
              this.loadError.set(true);
              this.foodsLoaded.set(true);
            }
          ),
          this.menuService.listen(
            menus => {
              this.rawMenus.set(menus);
              this.menusLoaded.set(true);
            },
            () => {
              this.loadError.set(true);
              this.menusLoaded.set(true);
            }
          )
        );
      },
      { allowSignalWrites: true }
    );
  }

  /** Kept for callers; data already follows the signed-in user. */
  start() {
    const today = localDateKey();
    if (today !== this.dayKey) {
      this.dayKey = today;
      this.loadPlan();
    }
  }

  menuNutrition(menu: Pick<Menu, 'ingredients'>): Macros {
    return ingredientsNutrition(menu.ingredients, this.foodsById());
  }

  instanceNutrition(p: PlannedMenu): Macros {
    return ingredientsNutrition(p.ingredients, this.foodsById());
  }

  addToPlan(menu: Menu, scale = 1): string {
    const instanceId = newId();
    const inst: PlannedMenu = {
      instanceId,
      menuId: menu.id!,
      name: menu.name,
      scale,
      ingredients: menu.ingredients.map(i => ({
        foodId: i.foodId,
        quantity: this.scaleQty(i.quantity, scale),
      })),
    };
    this.plan.update(p => [...p, inst]);
    this.persistPlan();
    this.touchMenu(menu.id!);
    return instanceId;
  }

  removeInstance(
    instanceId: string
  ): { item: PlannedMenu; index: number } | null {
    const index = this.plan().findIndex(p => p.instanceId === instanceId);
    if (index < 0) return null;
    const item = this.plan()[index];
    this.plan.update(p => p.filter(x => x.instanceId !== instanceId));
    this.persistPlan();
    return { item, index };
  }

  restoreInstance(r: { item: PlannedMenu; index: number }) {
    this.plan.update(p => {
      const next = [...p];
      next.splice(Math.min(r.index, next.length), 0, r.item);
      return next;
    });
    this.persistPlan();
  }

  setQty(instanceId: string, ingIndex: number, quantity: number) {
    if (!(quantity > 0)) return;
    this.mutate(instanceId, p => ({
      ...p,
      ingredients: p.ingredients.map((ing, i) =>
        i === ingIndex ? { ...ing, quantity } : ing
      ),
    }));
  }

  removeIngredient(instanceId: string, ingIndex: number) {
    this.mutate(instanceId, p => ({
      ...p,
      ingredients: p.ingredients.filter((_, i) => i !== ingIndex),
    }));
  }

  /** Re-scales from the current menu template (falls back to current quantities). */
  setScale(instanceId: string, scale: number) {
    this.mutate(instanceId, p => {
      const template = this.menusById().get(p.menuId);
      const base = template
        ? template.ingredients
        : p.ingredients.map(i => ({ ...i, quantity: i.quantity / p.scale }));
      return {
        ...p,
        scale,
        ingredients: base.map(i => ({
          foodId: i.foodId,
          quantity: this.scaleQty(i.quantity, scale),
        })),
      };
    });
  }

  markLogged(instanceIds: string[], at: number | undefined = Date.now()) {
    const set = new Set(instanceIds);
    this.plan.update(list =>
      list.map(p => (set.has(p.instanceId) ? { ...p, loggedAt: at } : p))
    );
    this.persistPlan();
  }

  clearPlan(): PlannedMenu[] {
    const prev = this.plan();
    this.plan.set([]);
    this.persistPlan();
    return prev;
  }

  setPlan(plan: PlannedMenu[]) {
    this.plan.set(plan);
    this.persistPlan();
  }

  /**
   * Writes today's plan for a specific account, even if this store hasn't
   * switched to that account yet (used right after sign-in, e.g. demo mode).
   */
  seedPlan(uid: string, menus: Menu[]) {
    const plan: PlannedMenu[] = menus.map(m => ({
      instanceId: newId(),
      menuId: m.id!,
      name: m.name,
      scale: 1,
      ingredients: m.ingredients.map(i => ({ ...i })),
    }));
    try {
      localStorage.setItem(
        `${PLAN_PREFIX}${uid}:${localDateKey()}`,
        JSON.stringify(plan)
      );
    } catch {}
    if (this.uid === uid) this.plan.set(plan);
  }

  touchMenu(menuId: string) {
    this.menuService
      .updateMenu(menuId, { lastUsedAt: Date.now() })
      .catch(() => {});
  }

  private mutate(instanceId: string, fn: (p: PlannedMenu) => PlannedMenu) {
    this.plan.update(list =>
      list.map(p => (p.instanceId === instanceId ? fn(p) : p))
    );
    this.persistPlan();
  }

  private scaleQty(q: number, scale: number): number {
    return Math.round(q * scale * 100) / 100;
  }

  private planKey() {
    return `${PLAN_PREFIX}${this.uid}:${this.dayKey}`;
  }

  private loadPlan() {
    try {
      const raw = localStorage.getItem(this.planKey());
      this.plan.set(raw ? JSON.parse(raw) : []);
    } catch {
      this.plan.set([]);
    }
  }

  private persistPlan() {
    try {
      if (this.uid)
        localStorage.setItem(this.planKey(), JSON.stringify(this.plan()));
    } catch {}
  }

  private prune() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
    const cutKey = localDateKey(cutoff);
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      // plan:{uid}:{date} (and the older plan:{date})
      if (k?.startsWith(PLAN_PREFIX) && k.split(':').pop()! < cutKey)
        drop.push(k);
    }
    drop.forEach(k => localStorage.removeItem(k));
  }
}
