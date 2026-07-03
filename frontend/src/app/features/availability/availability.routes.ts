import { Routes } from '@angular/router';

export const availabilityRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/availability-manager.component').then((m) => m.AvailabilityManagerComponent),
  },
];
