import { Injectable } from '@angular/core';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class StoreService {
  auth = new AuthStore().toSignalStore();

  mapState<T>(fn: (store: StoreService) => T) {
    return fn(this);
  }

  reset() {}
}
