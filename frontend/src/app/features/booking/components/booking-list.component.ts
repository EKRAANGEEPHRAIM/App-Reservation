import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { BookingStore } from '../store/booking.store';
import { AuthStore } from '../../auth/store/auth.store';
import { STATUS_LABEL } from '../../../core/utils/booking-status';
import { formatDuration, formatPrice } from '../../../core/config/salon';

const STATUS_CHIP: Record<string, string> = {
  CONFIRMED: 'chip-success',
  COMPLETED: 'chip-success',
  CANCELLED: 'chip-danger',
  NO_SHOW: 'chip-danger',
  PENDING: 'chip-warning',
};

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./booking-list.component.css'],
  template: `
    <div class="inner-page">
      <header class="head">
        <div>
          <h1 class="inner-page-title">Mes réservations</h1>
          <p class="inner-page-lead">Bonjour {{ authStore.user()?.firstName }}, voici vos rendez-vous chez Maison Awa.</p>
        </div>
        <a routerLink="/booking/new" class="btn-brand">
          <app-icon name="Plus" class="icon-sm" />
          Nouveau rendez-vous
        </a>
      </header>

      @if (booked()) {
        <div class="alert alert-success">
          Demande envoyée ! Votre coiffeuse va la confirmer ; vous paierez au salon le jour du rendez-vous.
        </div>
      }
      @if (payment() === 'cancelled') {
        <div class="alert alert-warning">
          Paiement annulé : votre réservation reste en attente, vous pouvez payer plus tard.
        </div>
      }
      @if (store.error()) {
        <div class="alert alert-error">{{ store.error() }}</div>
      }

      @if (store.loading()) {
        <div class="state"><div class="spinner"></div></div>
      } @else if (store.bookings().length === 0) {
        <div class="state">
          <app-icon name="Calendar" class="empty-icon" />
          <h2>Aucun rendez-vous pour l'instant</h2>
          <p>Choisissez une prestation et un horaire en moins d'une minute.</p>
          <a routerLink="/booking/new" class="btn-brand">Prendre rendez-vous</a>
        </div>
      } @else {
        <div class="list">
          @for (booking of store.bookings(); track booking.id) {
            <article class="card">
              <div class="when">
                <span class="when-day">{{ booking.startAt | date: 'd' : 'UTC' }}</span>
                <span class="when-month">{{ booking.startAt | date: 'MMM' : 'UTC' }}</span>
              </div>
              <div class="info">
                <p class="service">{{ booking.service.name }}</p>
                <p class="meta">
                  {{ booking.startAt | date: 'EEEE à HH:mm' : 'UTC' }} · {{ duration(booking.service.durationMin) }}
                </p>
                <p class="meta">avec {{ booking.provider.user.firstName }} {{ booking.provider.user.lastName }}</p>
              </div>
              <div class="aside">
                <p class="price">{{ price(booking.service.price, booking.service.currency) }}</p>
                <span class="chip" [class]="chipClass(booking.status)">{{ statusLabel(booking.status) }}</span>
                @if (booking.payment?.status === 'PAID') {
                  <p class="paid-label">Payé en ligne</p>
                }
                @if (booking.status === 'PENDING') {
                  <div class="action-row">
                    @if (booking.payment?.status !== 'PAID') {
                      <button
                        type="button"
                        class="btn-action btn-action-primary"
                        [disabled]="store.actionId() !== null"
                        (click)="store.payBooking(booking.id)"
                      >
                        @if (store.actionId() === booking.id) {
                          <app-icon name="Loader2" class="icon-sm animate-spin" />
                        } @else {
                          <app-icon name="CreditCard" class="icon-sm" />
                        }
                        Payer
                      </button>
                    }
                    <button
                      type="button"
                      class="btn-action btn-action-danger"
                      [disabled]="store.actionId() !== null"
                      (click)="cancel(booking.id)"
                    >
                      Annuler
                    </button>
                  </div>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class BookingListComponent {
  protected readonly store = inject(BookingStore);
  protected readonly authStore = inject(AuthStore);

  /** ?payment=cancelled au retour de Stripe Checkout */
  readonly payment = input<string>();
  /** ?booked=1 après une réservation payable au salon */
  readonly booked = input<string>();

  constructor() {
    this.store.loadMyBookings();
  }

  protected cancel(id: string): void {
    if (confirm('Annuler ce rendez-vous ?')) this.store.cancelBooking(id);
  }

  protected statusLabel(status: string): string {
    return STATUS_LABEL[status] ?? status;
  }

  protected chipClass(status: string): string {
    return STATUS_CHIP[status] ?? 'chip-default';
  }

  protected readonly price = formatPrice;
  protected readonly duration = formatDuration;
}
