import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface ProviderBooking {
  id: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  notes?: string | null;
  service: { id: string; name: string; price: number | string; durationMin: number; currency: string };
  client: { firstName: string; lastName: string; email: string; phone?: string | null };
  payment?: { status: string; amount: number } | null;
}

interface ProviderBookingState {
  bookings: ProviderBooking[];
  loading: boolean;
  /** Réservation dont le statut est en cours de modification */
  actionId: string | null;
  error: string | null;
}

const initialState: ProviderBookingState = {
  bookings: [],
  loading: false,
  actionId: null,
  error: null,
};

const isUpcoming = (b: ProviderBooking): boolean => new Date(b.endAt) > new Date();

export const ProviderBookingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ bookings }) => ({
    pending: computed(() => bookings().filter((b) => b.status === 'PENDING' && isUpcoming(b))),
    confirmed: computed(() => bookings().filter((b) => b.status === 'CONFIRMED')),
    history: computed(() =>
      bookings()
        .filter((b) => !['PENDING', 'CONFIRMED'].includes(b.status) || (b.status === 'PENDING' && !isUpcoming(b)))
        .reverse(),
    ),
  })),

  withMethods((store) => {
    const api = inject(ApiService);

    return {
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            api.get<ProviderBooking[]>('/bookings/provider').pipe(
              tap((bookings) => patchState(store, { bookings, loading: false })),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { loading: false, error: err.error?.message ?? 'Failed to load bookings' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      updateStatus: rxMethod<{ id: string; status: Exclude<BookingStatus, 'PENDING'> }>(
        pipe(
          tap(({ id }) => patchState(store, { actionId: id, error: null })),
          switchMap(({ id, status }) =>
            api.patch<{ status: BookingStatus }>(`/bookings/${id}/status`, { status }).pipe(
              tap((updated) =>
                patchState(store, {
                  actionId: null,
                  bookings: store.bookings().map((b) => (b.id === id ? { ...b, status: updated.status } : b)),
                }),
              ),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { actionId: null, error: err.error?.message ?? 'Update failed' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    };
  }),
);
