import { Injectable, inject } from '@angular/core';
import { deleteUser } from 'firebase/auth';
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { DEMO_LOG, demoBodyEntries, demoMeasurements } from '../data/demo-data';
import { STARTER_FOODS, STARTER_MENUS } from '../data/starter-data';
import { LoggedFood } from '../interface/nutrition.interface';
import { localDateKey, newId } from '../utils/date-key';
import { calcNutrition } from '../utils/nutrition';
import { FirebaseService } from './firebase.service';
import { SessionService } from './session.service';

export type UserCollection =
  | 'foods'
  | 'menus'
  | 'body_composition'
  | 'circumference'
  | 'logs';

/** All user data lives under users/{uid}/… (see firestore.rules). */
@Injectable({ providedIn: 'root' })
export class UserDataService {
  private firebase = inject(FirebaseService);
  private session = inject(SessionService);

  get db() {
    return this.firebase.db;
  }

  private requireUid(): string {
    const uid = this.session.uid();
    if (!uid) throw new Error('Not signed in');
    return uid;
  }

  col(name: UserCollection): CollectionReference {
    return collection(this.db, 'users', this.requireUid(), name);
  }

  docRef(name: UserCollection, id: string): DocumentReference {
    return doc(this.db, 'users', this.requireUid(), name, id);
  }

  profileRef(): DocumentReference {
    return doc(this.db, 'users', this.requireUid());
  }

  /** Starter foods + sample menus so a new user can try every feature. */
  async seedStarter() {
    const batch = writeBatch(this.db);
    const now = Date.now();
    for (const f of STARTER_FOODS) {
      const { id, ...data } = f;
      batch.set(this.docRef('foods', id), data);
    }
    for (const m of STARTER_MENUS) {
      const { id, ...data } = m;
      batch.set(this.docRef('menus', id), { ...data, updatedAt: now });
    }
    await batch.commit();
  }

  /** Starter library + today's log + 3 months of progress, for demo mode. */
  async seedDemo() {
    await this.seedStarter();
    const foods = new Map(STARTER_FOODS.map(f => [f.id, f]));
    const now = Date.now();
    const groups = new Map<string, string>();
    const items: LoggedFood[] = DEMO_LOG.map((e, i) => {
      const food = foods.get(e.foodId)!;
      const item: LoggedFood = {
        id: newId(),
        food,
        servingSize: e.qty,
        calculatedNutrition: calcNutrition(food, e.qty),
        loggedAt: now - (DEMO_LOG.length - i) * 3600_000,
      };
      if (e.menu) {
        if (!groups.has(e.menu.id)) groups.set(e.menu.id, newId());
        item.group = {
          id: groups.get(e.menu.id)!,
          menuId: e.menu.id,
          name: e.menu.name,
        };
      }
      return item;
    });

    const batch = writeBatch(this.db);
    batch.set(this.docRef('logs', localDateKey()), {
      items: JSON.parse(JSON.stringify(items)),
      updatedAt: now,
    });
    demoBodyEntries().forEach(b =>
      batch.set(doc(this.col('body_composition')), {
        ...b,
        ts: Timestamp.fromDate(b.ts),
      })
    );
    demoMeasurements().forEach(m =>
      batch.set(doc(this.col('circumference')), {
        ...m,
        ts: Timestamp.fromDate(m.ts),
      })
    );
    await batch.commit();
  }

  /** Deletes all of this account's data (in parallel) and the account itself. */
  async deleteAccountAndData() {
    const cols: UserCollection[] = [
      'foods',
      'menus',
      'body_composition',
      'circumference',
      'logs',
    ];
    const snaps = await Promise.all(cols.map(c => getDocs(this.col(c))));
    const refs = snaps.flatMap(s => s.docs.map(d => d.ref));
    const batches: Promise<void>[] = [];
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(this.db);
      refs.slice(i, i + 400).forEach(r => batch.delete(r));
      batches.push(batch.commit());
    }
    await Promise.all([...batches, deleteDoc(this.profileRef())]);
    const u = this.firebase.auth.currentUser;
    if (u) await deleteUser(u);
  }

  /**
   * True when the pre-account (shared) collections are still readable and
   * non-empty. After the new firestore.rules are deployed this returns false.
   */
  async legacyAvailable(): Promise<boolean> {
    try {
      const snap = await getDocs(query(collection(this.db, 'foods'), limit(1)));
      return !snap.empty;
    } catch {
      return false;
    }
  }

  /**
   * Copies data from the old shared collections into this user's space.
   * Food ids are kept so menus keep pointing at the right foods.
   */
  async importLegacy(): Promise<{
    foods: number;
    menus: number;
    body: number;
    measurements: number;
  }> {
    const [foods, menus, body, circ] = await Promise.all([
      getDocs(collection(this.db, 'foods')),
      getDocs(collection(this.db, 'menu')),
      getDocs(
        query(
          collection(this.db, 'body_composition'),
          where('userId', '==', 'default_user')
        )
      ),
      getDocs(
        query(
          collection(this.db, 'circumference'),
          where('userId', '==', 'default_user')
        )
      ),
    ]);

    const writes: { ref: DocumentReference; data: Record<string, unknown> }[] =
      [];
    foods.forEach(d => {
      const { id: _id, ...data } = d.data();
      writes.push({ ref: this.docRef('foods', d.id), data });
    });
    menus.forEach(d =>
      writes.push({ ref: this.docRef('menus', d.id), data: d.data() })
    );
    body.forEach(d => {
      const { userId: _u, ...data } = d.data();
      writes.push({ ref: this.docRef('body_composition', d.id), data });
    });
    circ.forEach(d => {
      const { userId: _u, ...data } = d.data();
      writes.push({ ref: this.docRef('circumference', d.id), data });
    });

    for (let i = 0; i < writes.length; i += 400) {
      const batch = writeBatch(this.db);
      writes.slice(i, i + 400).forEach(w => batch.set(w.ref, w.data));
      await batch.commit();
    }
    return {
      foods: foods.size,
      menus: menus.size,
      body: body.size,
      measurements: circ.size,
    };
  }
}
