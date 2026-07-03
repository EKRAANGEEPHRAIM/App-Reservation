import { Routes } from '@angular/router';

export const bookingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/booking-list.component').then((m) => m.BookingListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./components/booking-form.component').then((m) => m.BookingFormComponent),
  },
];
