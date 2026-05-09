import { Injectable, inject } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { Menu } from '../interface/menu.interface';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private firebaseService = inject(FirebaseService);

  async getMenuList(): Promise<Menu[]> {
    const querySnapshot = await getDocs(
      collection(this.firebaseService.db, 'menu')
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Menu[];
  }

  async getMenuById(id: string): Promise<Menu | null> {
    const docRef = doc(this.firebaseService.db, 'menu', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Menu;
    } else {
      return null;
    }
  }

  addMenu(menuData: Menu) {
    const docRef = doc(collection(this.firebaseService.db, 'menu'));
    return setDoc(docRef, menuData);
  }

  updateMenu(id: string, menuData: Partial<Menu>) {
    const docRef = doc(this.firebaseService.db, 'menu', id);
    return setDoc(docRef, menuData, { merge: true });
  }

  deleteMenu(id: string) {
    const docRef = doc(this.firebaseService.db, 'menu', id);
    return deleteDoc(docRef);
  }

  getMenuListRealtime(callback: (menus: Menu[]) => void) {
    const unsubscribe = onSnapshot(
      collection(this.firebaseService.db, 'menu'),
      querySnapshot => {
        const menus = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Menu[];
        callback(menus);
      },
      error => {
        console.error('Error getting real-time updates for menu:', error);
      }
    );
    return unsubscribe;
  }
}
