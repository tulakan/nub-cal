import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlSegment } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { StoreService } from '../../stores/store.service';
import { FirebaseService } from '../services/firebase.service';

export const authGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const router = inject(Router);
  const firebaseService = inject(FirebaseService);
  const store = inject(StoreService);

  /* set current url for display active menu item */
  const url: UrlSegment[] = route.url;
  const path = url[0]?.path ?? '';

  // Create an observable that checks Firebase auth state
  return new Observable<boolean>(observer => {
    const unsubscribe = onAuthStateChanged(firebaseService.auth, user => {
      if (user) {
        // User is authenticated
        observer.next(true);
      } else {
        // User is not authenticated, redirect to login
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
        });
        observer.next(false);
      }
      observer.complete();
    });

    // Return cleanup function
    return () => unsubscribe();
  }).pipe(
    take(1) // Only take the first emission
  );
};
