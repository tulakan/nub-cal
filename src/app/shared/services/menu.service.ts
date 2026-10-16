import { Injectable, inject } from '@angular/core';
import {
  Unsubscribe,
  addDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { Menu } from '../interface/menu.interface';
import { UserDataService } from './user-data.service';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private data = inject(UserDataService);

  listen(
    onData: (menus: Menu[]) => void,
    onError?: (e: unknown) => void
  ): Unsubscribe {
    return onSnapshot(
      this.data.col('menus'),
      snap => onData(snap.docs.map(d => ({ ...(d.data() as Menu), id: d.id }))),
      e => {
        console.error('menus listener', e);
        onError?.(e);
      }
    );
  }

  addMenu(menu: Menu) {
    const { id: _id, ...rest } = menu;
    return addDoc(this.data.col('menus'), { ...rest, updatedAt: Date.now() });
  }

  updateMenu(id: string, menu: Partial<Menu>) {
    const { id: _id, ...rest } = menu;
    return setDoc(this.data.docRef('menus', id), rest, { merge: true });
  }

  deleteMenu(id: string) {
    return deleteDoc(this.data.docRef('menus', id));
  }
}
