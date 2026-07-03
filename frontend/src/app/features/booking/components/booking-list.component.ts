import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { BookingStore } from '../store/booking.store';
import { AuthStore } from '../../auth/store/auth.store';

const STATUS_ICON: Record<string, string> = {
  CONFIRMED: 'CheckCircle2',
  CANCELLED: 'XCircle',
  PENDING: 'AlertCircle',
};

const STATUS_ICON_BG: Record<string, string> = {
  CONFIRMED: 'status-icon-success',
  CANCELLED: 'status-icon-danger',
  PENDING: 'status-icon-warning',
};

const STATUS_CHIP: Record<string, string> = {
  CONFIRMED: 'status-chip-success',
  CANCELLED: 'status-chip-danger',
  PENDING: 'status-chip-warning',
};

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./booking-list.component.css'],
  template: `
    <div class="booking-list-page">
      <header class="page-header">
        <div class="page-header-title">
          <h1>Mes réservations</h1>
          <p>Bonjour, {{ authStore.fullName() }}</p>
        </div>
        <a routerLink="/booking/new" class="btn-new">
          <app-icon name="Plus" class="icon-sm" />
          Nouvelle réservation
        </a>
      </header>

      <main class="page-content">
        @if (store.loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
        } @else if (store.bookings().length === 0) {
          <div class="empty-state">
            <app-icon name="Calendar" class="empty-icon" />
            <h3>Aucune réservation</h3>
            <p>Commencez par réserver un service</p>
            <a routerLink="/booking/new" class="btn-primary">Réserver maintenant</a>
          </div>
        } @else {
          <div class="booking-list">
            @for (booking of store.bookings(); track booking.id) {
              <div class="booking-card">
                <div class="booking-main">
                  <div class="status-icon" [class]="iconBgClass(booking.status)">
                    <app-icon [name]="statusIcon(booking.status)" class="icon-md" />
                  </div>
                  <div class="booking-info">
                    <p class="booking-service">{{ booking.service.name }}</p>
                    <p class="booking-meta">
                      {{ booking.startAt | date:'dd MMM yyyy à HH:mm' : '' : 'fr-FR' }}
                      · {{ booking.service.durationMin }}min
                    </p>
                    <p class="booking-provider">
                      {{ booking.provider.user.firstName }} {{ booking.provider.user.lastName }}
                    </p>
                  </div>
                </div>
                <div class="booking-aside">
                  <p class="booking-price">{{ booking.service.price }} €</p>
                  <span class="status-chip" [class]="chipClass(booking.status)">
                    {{ booking.status }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class BookingListComponent {
  protected readonly store = inject(BookingStore);
  protected readonly authStore = inject(AuthStore);

  constructor() {
    this.store.loadMyBookings();
  }

  protected statusIcon(status: string): string {
    return STATUS_ICON[status] ?? 'AlertCircle';
  }

  protected iconBgClass(status: string): string {
    return STATUS_ICON_BG[status] ?? 'status-icon-warning';
  }

  protected chipClass(status: string): string {
    return STATUS_CHIP[status] ?? 'status-chip-default';
  }
}
