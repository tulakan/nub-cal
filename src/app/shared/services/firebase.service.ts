import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseConfig } from '../../../environments/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app = initializeApp(FirebaseConfig);
  public db: Firestore = getFirestore(this.app);
  public auth: Auth = getAuth(this.app);

  constructor() {
    // console.log('Firebase initialized', this.app);
  }
}
