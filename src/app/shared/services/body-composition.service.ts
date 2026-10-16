import { Injectable, inject } from '@angular/core';
import { Timestamp, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import {
  BodyComposition,
  Circumference,
} from '../interface/body-composition.interface';
import { UserDataService } from './user-data.service';

type Coll = 'body_composition' | 'circumference';

@Injectable({ providedIn: 'root' })
export class BodyCompositionService {
  private data = inject(UserDataService);

  getBodyComposition(): Promise<BodyComposition[]> {
    return this.list<BodyComposition>('body_composition');
  }

  getCircumference(): Promise<Circumference[]> {
    return this.list<Circumference>('circumference');
  }

  addBodyComposition(entry: Omit<BodyComposition, 'id'>) {
    return this.add('body_composition', entry);
  }

  addCircumference(entry: Omit<Circumference, 'id'>) {
    return this.add('circumference', entry);
  }

  deleteEntry(coll: Coll, id: string) {
    return deleteDoc(this.data.docRef(coll, id));
  }

  private async list<T extends { ts: Date }>(coll: Coll): Promise<T[]> {
    const snap = await getDocs(this.data.col(coll));
    return snap.docs
      .map(d => {
        const raw = d.data();
        const ts =
          raw['ts'] instanceof Timestamp
            ? raw['ts'].toDate()
            : new Date(raw['ts']);
        return { ...raw, id: d.id, ts } as unknown as T;
      })
      .sort((a, b) => a.ts.getTime() - b.ts.getTime());
  }

  private add(coll: Coll, entry: { ts: Date } & Record<string, unknown>) {
    const {
      userId: _u,
      id: _id,
      ...rest
    } = entry as Record<string, unknown> & { ts: Date };
    return addDoc(this.data.col(coll), {
      ...rest,
      ts: Timestamp.fromDate(entry.ts),
    });
  }
}
