import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { FirebaseConfig } from '../../../environments/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app = initializeApp(FirebaseConfig);
  /** Offline cache so foods/menus/logs work without a connection (PWA). */
  public db: Firestore = initializeFirestore(this.app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  public auth: Auth = getAuth(this.app);
}
