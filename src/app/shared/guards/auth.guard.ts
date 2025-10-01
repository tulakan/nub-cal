import { inject } from '@angular/core';
import { CanActivateFn, UrlSegment } from '@angular/router';
import { StoreService } from '../../stores/store.service';

export const authGuard: CanActivateFn = (route, state) => {
  /* set current url for display active menu item */
  const store = inject(StoreService);
  const url: UrlSegment[] = route.url;
  const path = url[0]?.path ?? '';

  // Check if logged in
  if (store.auth.isLoggedIn()) {
    return true;
  }
  return false;
};
