import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed } from '@angular/core';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ user, accessToken }) => ({
    isAuthenticated: computed(() => !!accessToken() && !!user()),
    isAdmin: computed(() => user()?.role === 'ADMIN'),
    isProvider: computed(() => user()?.role === 'PROVIDER'),
    fullName: computed(() => user() ? `${user()!.firstName} ${user()!.lastName}` : ''),
  })),

  withMethods((store) => {
    const http = inject(HttpClient);
    const router = inject(Router);
    const apiUrl = environment.apiUrl;

    return {
      login: rxMethod<{ email: string; password: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((credentials) =>
            http.post<{ accessToken: string; refreshToken: string }>(
              `${apiUrl}/auth/login`,
              credentials,
            ).pipe(
              tap(({ accessToken, refreshToken }) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                patchState(store, { accessToken, refreshToken, loading: false });
              }),
              switchMap(() =>
                http.get<User>(`${apiUrl}/users/me`).pipe(
                  tap((user) => {
                    patchState(store, { user });
                    void router.navigate([user.role === 'ADMIN' ? '/admin' : '/booking']);
                  }),
                ),
              ),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { loading: false, error: err.error?.message ?? 'Login failed' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      register: rxMethod<{ email: string; password: string; firstName: string; lastName: string; role?: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((data) =>
            http.post<{ accessToken: string; refreshToken: string }>(
              `${apiUrl}/auth/register`,
              data,
            ).pipe(
              tap(({ accessToken, refreshToken }) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                patchState(store, { accessToken, refreshToken, loading: false });
              }),
              switchMap(() =>
                http.get<User>(`${apiUrl}/users/me`).pipe(
                  tap((user) => patchState(store, { user })),
                ),
              ),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { loading: false, error: err.error?.message ?? 'Register failed' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadCurrentUser: rxMethod<void>(
        pipe(
          switchMap(() =>
            http.get<User>(`${apiUrl}/users/me`).pipe(
              tap((user) => patchState(store, { user })),
              catchError(() => {
                patchState(store, { user: null, accessToken: null });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      logout(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        patchState(store, { user: null, accessToken: null, refreshToken: null });
        void router.navigate(['/auth/login']);
      },
    };
  }),
);
