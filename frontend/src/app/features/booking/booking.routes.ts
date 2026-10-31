import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const bookingRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/booking-list.component').then((m) => m.BookingListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./components/booking-form.component').then((m) => m.BookingFormComponent),
  },
];
