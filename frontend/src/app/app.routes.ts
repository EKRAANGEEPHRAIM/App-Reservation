import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'booking',
    canActivate: [authGuard],
    loadChildren: () => import('./features/booking/booking.routes').then((m) => m.bookingRoutes),
  },
  {
    path: 'availability',
    canActivate: [authGuard],
    loadChildren: () => import('./features/availability/availability.routes').then((m) => m.availabilityRoutes),
  },
  {
    path: 'payment',
    canActivate: [authGuard],
    loadChildren: () => import('./features/payment/payment.routes').then((m) => m.paymentRoutes),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
