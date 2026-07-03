import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'bookings',
    loadComponent: () => import('./components/bookings-table.component').then((m) => m.BookingsTableComponent),
  },
  {
    path: 'users',
    loadComponent: () => import('./components/users-table.component').then((m) => m.UsersTableComponent),
  },
];
