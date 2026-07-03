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
  service: { id: string; name: string; price: number; durationMin: number };
  provider: { id: string; user: { firstName: string; lastName: string; avatarUrl?: string } };
  payment?: { status: string; amount: number } | null;
}

interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
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

      selectBooking(booking: Booking): void {
        patchState(store, { selectedBooking: booking });
      },

      clearSelected(): void {
        patchState(store, { selectedBooking: null });
      },
    };
  }),
);
