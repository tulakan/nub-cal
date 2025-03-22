import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/body-composition/body-composition.page').then(
        (m) => m.BodyCompositionPage
      ),
  },
];
