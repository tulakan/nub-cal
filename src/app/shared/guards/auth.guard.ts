import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProfileStore } from '../../stores/profile.store';
import { SessionService } from '../services/session.service';

/**
 * App pages: signed-in users who finished setup.
 * Everyone else lands on /login (which offers "Get started" / "Continue setup").
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const session = inject(SessionService);
  const profile = inject(ProfileStore);

  await session.ready;
  if (!session.user()) {
    const returnUrl =
      state.url && state.url !== '/' && state.url !== '/today'
        ? state.url
        : null;
    return router.createUrlTree(['/login'], {
      queryParams: returnUrl ? { returnUrl } : {},
    });
  }
  const p = await profile.whenLoaded();
  if (p && !p.onboarded) return router.createUrlTree(['/login']);
  return true;
};

/** /login: skip straight to the app when already signed in and set up. */
export const loginPageGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const profile = inject(ProfileStore);
  await session.ready;
  if (!session.user()) return true;
  const p = await profile.whenLoaded();
  return p?.onboarded ? inject(Router).createUrlTree(['/today']) : true;
};

/** /welcome: new visitors, signed-in users who haven't finished setup, or ?mode=targets. */
export const welcomeGuard: CanActivateFn = async route => {
  const router = inject(Router);
  const session = inject(SessionService);
  const profile = inject(ProfileStore);
  await session.ready;
  const targetsMode = route.queryParamMap.get('mode') === 'targets';
  if (!session.user())
    return targetsMode ? router.createUrlTree(['/login']) : true;
  if (targetsMode) return true;
  const p = await profile.whenLoaded();
  return p?.onboarded ? router.createUrlTree(['/today']) : true;
};
