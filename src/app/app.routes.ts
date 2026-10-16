import { Routes } from '@angular/router';
import {
  authGuard,
  loginPageGuard,
  welcomeGuard,
} from './shared/guards/auth.guard';
import { unsavedChangesGuard } from './shared/guards/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginPageGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginPage),
  },
  {
    path: 'welcome',
    canActivate: [welcomeGuard],
    loadComponent: () =>
      import('./pages/welcome/welcome.page').then(m => m.WelcomePage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main/main.component').then(m => m.MainComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'today',
        data: { title: 'Today' },
        loadComponent: () =>
          import('./pages/food-log/food-log.component').then(
            m => m.FoodLogPage
          ),
      },
      {
        path: 'plan',
        data: { title: 'Plan' },
        loadComponent: () =>
          import('./pages/menu-plan/menu-plan.component').then(
            m => m.MenuPlanComponent
          ),
      },
      {
        path: 'plan/menu/new',
        data: { title: 'New menu', nav: false, back: '/plan' },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./dialogs/create-menu/create-menu.component').then(
            m => m.CreateMenuComponent
          ),
      },
      {
        path: 'plan/menu/:id',
        data: { title: 'Edit menu', nav: false, back: '/plan' },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./dialogs/create-menu/create-menu.component').then(
            m => m.CreateMenuComponent
          ),
      },
      {
        path: 'foods',
        data: { title: 'Foods' },
        loadComponent: () =>
          import('./pages/food-list/food-list.component').then(
            m => m.FoodListComponent
          ),
      },
      {
        path: 'progress',
        data: { title: 'Progress' },
        loadComponent: () =>
          import('./pages/progress/progress.page').then(m => m.ProgressPage),
      },
      // legacy URLs (bookmarks / installed shortcuts)
      { path: 'food-log', redirectTo: 'today', pathMatch: 'full' },
      { path: 'menu-plan', redirectTo: 'plan', pathMatch: 'full' },
      { path: 'menu-create', redirectTo: 'plan/menu/new', pathMatch: 'full' },
      { path: 'menu-edit/:id', redirectTo: 'plan/menu/:id' },
      { path: 'food-list', redirectTo: 'foods', pathMatch: 'full' },
      { path: 'body-composition', redirectTo: 'progress', pathMatch: 'full' },
      { path: 'circumference', redirectTo: 'progress', pathMatch: 'full' },
      { path: '', redirectTo: 'today', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'today' },
];
