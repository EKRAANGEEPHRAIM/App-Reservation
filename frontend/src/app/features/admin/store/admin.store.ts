import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  recentBookings: unknown[];
}

interface AdminState {
  stats: DashboardStats | null;
  bookings: unknown[];
  users: unknown[];
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  bookings: [],
  users: [],
  totalPages: 1,
  currentPage: 1,
  loading: false,
  error: null,
};

export const AdminStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withMethods((store) => {
    const api = inject(ApiService);

    return {
      loadDashboard: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            api.get<DashboardStats>('/admin/dashboard').pipe(
              tap((stats) => patchState(store, { stats, loading: false })),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { loading: false, error: err.error?.message ?? 'Failed' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadBookings: rxMethod<{ page?: number }>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ page = 1 }) =>
            api.get<{ bookings: unknown[]; totalPages: number; page: number }>(
              '/admin/bookings',
              { page: String(page), limit: '20' },
            ).pipe(
              tap(({ bookings, totalPages, page: currentPage }) =>
                patchState(store, { bookings, totalPages, currentPage, loading: false }),
              ),
              catchError(() => { patchState(store, { loading: false }); return EMPTY; }),
            ),
          ),
        ),
      ),

      loadUsers: rxMethod<{ page?: number }>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ page = 1 }) =>
            api.get<{ users: unknown[]; totalPages: number }>(
              '/admin/users',
              { page: String(page), limit: '20' },
            ).pipe(
              tap(({ users, totalPages }) =>
                patchState(store, { users, totalPages, loading: false }),
              ),
              catchError(() => { patchState(store, { loading: false }); return EMPTY; }),
            ),
          ),
        ),
      ),
    };
  }),
);
