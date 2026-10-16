import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Unsubscribe, onSnapshot, setDoc } from 'firebase/firestore';
import { Food } from '../shared/interface/food.interface';
import {
  LoggedFood,
  TargetMacros,
} from '../shared/interface/nutrition.interface';
import { MenuService } from '../shared/services/menu.service';
import { SessionService } from '../shared/services/session.service';
import { UserDataService } from '../shared/services/user-data.service';
import { localDateKey, newId } from '../shared/utils/date-key';
import {
  Macros,
  calcNutrition,
  subtractMacros,
  sumNutrition,
} from '../shared/utils/nutrition';
import { ProfileStore } from './profile.store';

/** Pre-account keys (single-user era). Claimed once by the first account on this device. */
const LEGACY_LOG_KEY = 'food-log-logged-foods';
const LEGACY_TARGET_KEY = 'food-log-target-macros';
const LEGACY_DAY_PREFIX = 'food-log:';
const LEGACY_CLAIMED_KEY = 'nubcal-legacy-claimed-by';

const LOG_PREFIX = 'log:'; // log:{uid}:{YYYY-MM-DD}
const KEEP_DAYS = 30;

export const DEFAULT_TARGETS: TargetMacros = {
  kcal: 2000,
  protein: 150,
  carb: 250,
  fat: 67,
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write failed', e);
  }
}

/** Firestore rejects `undefined`; JSON round-trip drops those fields. */
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/**
 * Today's food log for the signed-in user.
 * localStorage is the instant cache; users/{uid}/logs/{date} is the source of truth.
 */
@Injectable({ providedIn: 'root' })
export class FoodLogStore {
  private menuService = inject(MenuService);
  private session = inject(SessionService);
  private data = inject(UserDataService);
  private profile = inject(ProfileStore);

  private uid: string | null = null;
  private dayKey = signal(localDateKey());
  private unsub: Unsubscribe | null = null;

  readonly items = signal<LoggedFood[]>([]);
  readonly targets = computed<TargetMacros>(
    () => this.profile.profile()?.targets ?? DEFAULT_TARGETS
  );

  readonly consumed = computed<Macros>(() =>
    sumNutrition(this.items().map(i => i.calculatedNutrition))
  );
  readonly remaining = computed<Macros>(() =>
    subtractMacros(this.targets(), this.consumed())
  );
  readonly date = computed(() => this.dayKey());

  constructor() {
    effect(
      () => {
        const uid = this.session.uid();
        this.uid = uid;
        this.unsub?.();
        this.unsub = null;
        this.items.set([]);
        if (!uid) return;
        this.claimLegacy(uid);
        this.prune();
        this.loadDay();
      },
      { allowSignalWrites: true }
    );

    // Roll over to the new day if the installed PWA stays open past midnight.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.refreshDay();
      });
    }
  }

  /** Recent unique foods, newest first (from this device's cached days). */
  recentFoods(limit = 10): Food[] {
    if (!this.uid) return [];
    const prefix = `${LOG_PREFIX}${this.uid}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) keys.push(k);
    }
    keys.sort().reverse();
    const seen = new Set<string>();
    const out: Food[] = [];
    for (const k of keys) {
      const items = read<LoggedFood[]>(k) ?? [];
      for (const it of [...items].reverse()) {
        if (!it.food?.id || seen.has(it.food.id)) continue;
        seen.add(it.food.id);
        out.push(it.food);
        if (out.length >= limit) return out;
      }
    }
    return out;
  }

  add(foods: LoggedFood[]): string[] {
    const stamped = foods.map(f => ({
      ...f,
      id: f.id ?? newId(),
      loggedAt: f.loggedAt ?? Date.now(),
    }));
    this.items.update(list => [...list, ...stamped]);
    this.persist();
    return stamped.map(f => f.id!);
  }

  addFood(food: Food, quantity: number): string {
    return this.add([
      {
        food,
        servingSize: quantity,
        calculatedNutrition: calcNutrition(food, quantity),
      },
    ])[0];
  }

  /** Removes by id and returns [item, index] pairs for undo. */
  remove(ids: string[]): { item: LoggedFood; index: number }[] {
    const set = new Set(ids);
    const removed: { item: LoggedFood; index: number }[] = [];
    this.items().forEach((item, index) => {
      if (item.id && set.has(item.id)) removed.push({ item, index });
    });
    this.items.update(list => list.filter(i => !i.id || !set.has(i.id)));
    this.persist();
    return removed;
  }

  restore(removed: { item: LoggedFood; index: number }[]) {
    this.items.update(list => {
      const next = [...list];
      [...removed]
        .sort((a, b) => a.index - b.index)
        .forEach(r => next.splice(Math.min(r.index, next.length), 0, r.item));
      return next;
    });
    this.persist();
  }

  updateQuantity(id: string, quantity: number) {
    this.items.update(list =>
      list.map(i =>
        i.id === id
          ? {
              ...i,
              servingSize: quantity,
              calculatedNutrition: calcNutrition(i.food, quantity),
            }
          : i
      )
    );
    this.persist();
  }

  clear(): LoggedFood[] {
    const prev = this.items();
    this.items.set([]);
    this.persist();
    return prev;
  }

  setAll(items: LoggedFood[]) {
    this.items.set(items);
    this.persist();
  }

  /**
   * Logs a menu-like {name, ingredients} as one group.
   * Ingredients whose food no longer exists are skipped and counted.
   */
  logMenu(
    menu: {
      menuId: string;
      name: string;
      ingredients: { foodId: string; quantity: number }[];
    },
    foodsById: Map<string, Food>
  ): { ids: string[]; skipped: number } {
    const groupId = newId();
    const entries: LoggedFood[] = [];
    let skipped = 0;
    for (const ing of menu.ingredients) {
      const food = foodsById.get(ing.foodId);
      if (!food) {
        skipped++;
        continue;
      }
      entries.push({
        food,
        servingSize: ing.quantity,
        calculatedNutrition: calcNutrition(food, ing.quantity),
        group: { id: groupId, menuId: menu.menuId, name: menu.name },
      });
    }
    const ids = entries.length ? this.add(entries) : [];
    if (menu.menuId) {
      this.menuService
        .updateMenu(menu.menuId, { lastUsedAt: Date.now() })
        .catch(() => {});
    }
    return { ids, skipped };
  }

  setTargets(t: TargetMacros) {
    return this.profile.update({ targets: t });
  }

  resetTargets() {
    return this.setTargets({ ...DEFAULT_TARGETS });
  }

  refreshDay() {
    const k = localDateKey();
    if (k !== this.dayKey()) {
      this.dayKey.set(k);
      if (this.uid) this.loadDay();
    }
  }

  private cacheKey() {
    return `${LOG_PREFIX}${this.uid}:${this.dayKey()}`;
  }

  private loadDay() {
    const uid = this.uid;
    if (!uid) return;
    const day = this.dayKey();
    const cached = read<LoggedFood[]>(this.cacheKey()) ?? [];
    this.items.set(cached.map(i => ({ ...i, id: i.id ?? newId() })));

    this.unsub?.();
    let first = true;
    this.unsub = onSnapshot(
      this.data.docRef('logs', day),
      snap => {
        if (this.uid !== uid || this.dayKey() !== day) return;
        if (snap.exists()) {
          const items = (snap.data()['items'] as LoggedFood[]) ?? [];
          this.items.set(items);
          write(this.cacheKey(), items);
        } else if (first && !snap.metadata.fromCache && this.items().length) {
          // Device has entries the server doesn't (first sync / offline edits).
          this.persist();
        }
        first = false;
      },
      e => console.error('log listener', e)
    );
  }

  private persist() {
    if (!this.uid) return;
    const items = clean(this.items());
    write(this.cacheKey(), items);
    setDoc(this.data.docRef('logs', this.dayKey()), {
      items,
      updatedAt: Date.now(),
    }).catch(e => console.error('log save failed', e));
  }

  /**
   * Moves logs/targets saved before accounts existed into the first account
   * that signs in on this device (once).
   */
  private claimLegacy(uid: string) {
    try {
      if (localStorage.getItem(LEGACY_CLAIMED_KEY)) return;
      const today = localDateKey();
      const legacy = read<LoggedFood[]>(LEGACY_LOG_KEY);
      if (legacy?.length) {
        const key = `${LOG_PREFIX}${uid}:${today}`;
        write(key, [...(read<LoggedFood[]>(key) ?? []), ...legacy]);
      }
      const moved: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(LEGACY_DAY_PREFIX)) moved.push(k);
      }
      moved.forEach(k => {
        const date = k.slice(LEGACY_DAY_PREFIX.length);
        const key = `${LOG_PREFIX}${uid}:${date}`;
        write(key, [
          ...(read<LoggedFood[]>(key) ?? []),
          ...(read<LoggedFood[]>(k) ?? []),
        ]);
        localStorage.removeItem(k);
      });
      const t = read<TargetMacros>(LEGACY_TARGET_KEY);
      if (t) {
        this.profile.whenLoaded().then(p => {
          if (!p?.targets) this.profile.update({ targets: t }).catch(() => {});
        });
      }
      localStorage.removeItem(LEGACY_LOG_KEY);
      localStorage.removeItem(LEGACY_TARGET_KEY);
      localStorage.setItem(LEGACY_CLAIMED_KEY, uid);
    } catch {}
  }

  private prune() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
    const cutKey = localDateKey(cutoff);
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(LOG_PREFIX) && k.split(':').pop()! < cutKey)
        drop.push(k);
    }
    drop.forEach(k => localStorage.removeItem(k));
  }
}
