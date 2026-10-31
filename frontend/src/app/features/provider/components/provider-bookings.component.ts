import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { AuthStore } from '../../auth/store/auth.store';
import { STATUS_LABEL } from '../../../core/utils/booking-status';
import { formatPrice } from '../../../core/config/salon';
import { BookingStatus, ProviderBooking, ProviderBookingStore } from '../store/provider-booking.store';

const STATUS_CHIP: Record<string, string> = {
  PENDING: 'status-chip-warning',
  CONFIRMED: 'status-chip-success',
  CANCELLED: 'status-chip-danger',
};

@Component({
  selector: 'app-provider-bookings',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./provider-bookings.component.css'],
  template: `
    <div class="inner-page">
      <header class="page-header">
        <div>
          <h1 class="inner-page-title">Mes rendez-vous</h1>
          <p class="inner-page-lead">Bonjour {{ authStore.user()?.firstName }}, voici les demandes de vos clientes et clients.</p>
        </div>
        <a routerLink="/availability" class="btn-action">
          <app-icon name="Calendar" class="icon-sm" />
          Mes horaires
        </a>
      </header>

      <div>
        @if (store.error()) {
          <div class="alert alert-error">{{ store.error() }}</div>
        }

        @if (store.loading()) {
          <div class="loading-state"><div class="spinner"></div></div>
        } @else if (store.bookings().length === 0) {
          <div class="empty-state">
            <app-icon name="Calendar" class="empty-icon" />
            <h3>Aucun rendez-vous pour l'instant</h3>
            <p>Les réservations de vos clients apparaîtront ici.</p>
          </div>
        } @else {
          <section class="section">
            <h2>À confirmer <span class="count">{{ store.pending().length }}</span></h2>
            @for (booking of store.pending(); track booking.id) {
              <ng-container *ngTemplateOutlet="card; context: { $implicit: booking }" />
            } @empty {
              <p class="section-empty">Aucune demande en attente.</p>
            }
          </section>

          <section class="section">
            <h2>Confirmés <span class="count">{{ store.confirmed().length }}</span></h2>
            @for (booking of store.confirmed(); track booking.id) {
              <ng-container *ngTemplateOutlet="card; context: { $implicit: booking }" />
            } @empty {
              <p class="section-empty">Aucun rendez-vous confirmé.</p>
            }
          </section>

          @if (store.history().length > 0) {
            <section class="section">
              <h2>Historique</h2>
              @for (booking of store.history(); track booking.id) {
                <ng-container *ngTemplateOutlet="card; context: { $implicit: booking }" />
              }
            </section>
          }
        }
      </div>
    </div>

    <ng-template #card let-booking>
      <article class="booking-card">
        <div class="booking-when">
          <p class="day">{{ booking.startAt | date: 'EEE d MMM' : 'UTC' }}</p>
          <p class="time">{{ booking.startAt | date: 'HH:mm' : 'UTC' }} – {{ booking.endAt | date: 'HH:mm' : 'UTC' }}</p>
        </div>
        <div class="booking-body">
          <p class="service">{{ booking.service.name }} · {{ price(booking.service.price, booking.service.currency) }}</p>
          <p class="client">
            <app-icon name="User" class="icon-sm" />
            {{ booking.client.firstName }} {{ booking.client.lastName }}
            <span class="contact">{{ booking.client.phone ?? booking.client.email }}</span>
          </p>
          @if (booking.notes) {
            <p class="notes">« {{ booking.notes }} »</p>
          }
        </div>
        <div class="booking-side">
          <span class="status-chip" [class]="chipClass(booking.status)">{{ statusLabel(booking.status) }}</span>
          @if (booking.payment?.status === 'PAID') {
            <p class="paid-label">Payé en ligne</p>
          }
          <div class="action-row">
            @if (booking.status === 'PENDING') {
              <button type="button" class="btn-action btn-action-success" [disabled]="busy()" (click)="set(booking, 'CONFIRMED')">
                Confirmer
              </button>
              <button type="button" class="btn-action btn-action-danger" [disabled]="busy()" (click)="set(booking, 'CANCELLED')">
                Refuser
              </button>
            } @else if (booking.status === 'CONFIRMED') {
              @if (hasStarted(booking)) {
                <button type="button" class="btn-action btn-action-success" [disabled]="busy()" (click)="set(booking, 'COMPLETED')">
                  Terminé
                </button>
                <button type="button" class="btn-action" [disabled]="busy()" (click)="set(booking, 'NO_SHOW')">
                  Absent
                </button>
              } @else {
                <button type="button" class="btn-action btn-action-danger" [disabled]="busy()" (click)="set(booking, 'CANCELLED')">
                  Annuler
                </button>
              }
            }
          </div>
        </div>
      </article>
    </ng-template>
  `,
})
export class ProviderBookingsComponent {
  protected readonly store = inject(ProviderBookingStore);
  protected readonly authStore = inject(AuthStore);

  constructor() {
    this.store.load();
  }

  protected busy(): boolean {
    return this.store.actionId() !== null;
  }

  protected set(booking: ProviderBooking, status: Exclude<BookingStatus, 'PENDING'>): void {
    if (status === 'CANCELLED' && !confirm('Annuler ce rendez-vous ? Le client verra la réservation comme annulée.')) {
      return;
    }
    this.store.updateStatus({ id: booking.id, status });
  }

  protected hasStarted(booking: ProviderBooking): boolean {
    return new Date(booking.startAt) <= new Date();
  }

  protected statusLabel(status: string): string {
    return STATUS_LABEL[status] ?? status;
  }

  protected chipClass(status: string): string {
    return STATUS_CHIP[status] ?? 'status-chip-default';
  }

  protected readonly price = formatPrice;
}
