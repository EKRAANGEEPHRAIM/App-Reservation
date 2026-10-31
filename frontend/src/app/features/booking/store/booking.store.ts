import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface Booking {
  id: string;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  service: { id: string; name: string; price: number | string; durationMin: number; currency: string };
  provider: { id: string; user: { firstName: string; lastName: string; avatarUrl?: string } };
  payment?: { status: string; amount: number } | null;
}

interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  /** Réservation dont le paiement ou l'annulation est en cours */
  actionId: string | null;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
  actionId: null,
  error: null,
};

export const BookingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ bookings }) => ({
    pendingBookings: computed(() => bookings().filter((b) => b.status === 'PENDING')),
    confirmedBookings: computed(() => bookings().filter((b) => b.status === 'CONFIRMED')),
    upcomingBookings: computed(() =>
      bookings().filter((b) =>
        ['PENDING', 'CONFIRMED'].includes(b.status) && new Date(b.startAt) > new Date(),
      ),
    ),
  })),

  withMethods((store) => {
    const api = inject(ApiService);

    return {
      loadMyBookings: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            api.get<Booking[]>('/bookings/my').pipe(
              tap((bookings) => patchState(store, { bookings, loading: false })),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { loading: false, error: err.error?.message ?? 'Failed to load bookings' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      createBooking: rxMethod<{ providerId: string; serviceId: string; startAt: string; notes?: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((dto) =>
            api.post<Booking>('/bookings', dto).pipe(
              tap((booking) =>
                patchState(store, {
                  bookings: [booking, ...store.bookings()],
                  loading: false,
                }),
              ),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { loading: false, error: err.error?.message ?? 'Booking failed' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      // Crée une session Stripe Checkout puis quitte l'application vers la page de paiement
      payBooking: rxMethod<string>(
        pipe(
          tap((id) => patchState(store, { actionId: id, error: null })),
          switchMap((bookingId) =>
            api.post<{ url: string }>('/payments/checkout', { bookingId }).pipe(
              tap(({ url }) => window.location.assign(url)),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { actionId: null, error: err.error?.message ?? 'Payment failed' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      cancelBooking: rxMethod<string>(
        pipe(
          tap((id) => patchState(store, { actionId: id, error: null })),
          switchMap((id) =>
            api.patch<{ status: Booking['status'] }>(`/bookings/${id}/status`, { status: 'CANCELLED' }).pipe(
              tap(({ status }) =>
                patchState(store, {
                  actionId: null,
                  bookings: store.bookings().map((b) => (b.id === id ? { ...b, status } : b)),
                }),
              ),
              catchError((err: { error?: { message?: string } }) => {
                patchState(store, { actionId: null, error: err.error?.message ?? 'Cancellation failed' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      selectBooking(booking: Booking): void {
        patchState(store, { selectedBooking: booking });
      },

      clearSelected(): void {
        patchState(store, { selectedBooking: null });
      },
    };
  }),
);
