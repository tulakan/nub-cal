import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main/main.component').then(m => m.MainComponent),
    children: [
      {
        path: 'food-log',
        loadComponent: () =>
          import('./pages/food-log/food-log.component').then(
            m => m.FoodLogPage
          ),
      },
      {
        path: 'food-list',
        loadComponent: () =>
          import('./pages/food-list/food-list.component').then(
            m => m.FoodListComponent
          ),
      },
      {
        path: 'theme-demo',
        loadComponent: () =>
          import('./theme-demo.component').then(m => m.ThemeDemoComponent),
      },
      {
        path: '',
        redirectTo: 'food-log',
        pathMatch: 'full',
      },
    ],
    canActivate: [],
  },

  // {
  //   path: '',
  //   loadComponent: () =>
  //     import('./pages/body-composition/body-composition.page').then(
  //       (m) => m.BodyCompositionPage
  //     ),
  // },
];
