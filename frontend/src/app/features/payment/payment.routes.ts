import { Routes } from '@angular/router';

export const paymentRoutes: Routes = [
  {
    path: 'success',
    loadComponent: () => import('./components/payment-success.component').then((m) => m.PaymentSuccessComponent),
  },
];
