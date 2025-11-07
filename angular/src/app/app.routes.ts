import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'index', loadComponent: () => import('./components/index/index.component').then(m => m.IndexComponent) },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
];
