import { Routes } from '@angular/router';

export const providerRoutes: Routes = [
  {
    path: 'bookings',
    loadComponent: () =>
      import('./components/provider-bookings.component').then((m) => m.ProviderBookingsComponent),
  },
  { path: '', redirectTo: 'bookings', pathMatch: 'full' },
];
