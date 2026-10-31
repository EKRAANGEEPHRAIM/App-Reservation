import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from '../../features/auth/store/auth.store';

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return authStore
    .restoreSession()
    .pipe(map(() => (authStore.isAdmin() ? true : router.createUrlTree(['/']))));
};
