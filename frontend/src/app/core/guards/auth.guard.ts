import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from '../../features/auth/store/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Après un rechargement, l'utilisateur est reconstruit depuis le jeton stocké
  return authStore
    .restoreSession()
    .pipe(map((ok) => (ok ? true : router.createUrlTree(['/auth/login']))));
};
