import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { AdminStore } from '../store/admin.store';

interface BookingRow {
  id: string;
  clientName: string;
  serviceName: string;
  startAt: string;
  status: string;
  price: number;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'status-chip-warning',
  CONFIRMED: 'status-chip-success',
  CANCELLED: 'status-chip-danger',
  COMPLETED: 'status-chip-info',
};

@Component({
  selector: 'app-bookings-table',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./bookings-table.component.css'],
  template: `
    <div class="bookings-page">
      <header class="page-header">
        <a routerLink="/admin" class="back-link">
          <app-icon name="ChevronLeft" class="icon-sm" />
          <span>Dashboard</span>
        </a>
        <h1>Toutes les réservations</h1>
      </header>

      <main class="page-content">
        @if (store.loading()) {
          <div class="loading-state">
            <app-icon name="Loader2" class="icon-lg animate-spin" />
          </div>
        } @else if (store.error()) {
          <div class="error-state">
            <app-icon name="AlertCircle" class="error-icon" />
            <p class="error-title">Une erreur est survenue</p>
            <p class="error-text">{{ store.error() }}</p>
            <button (click)="store.loadBookings({ page: store.currentPage() })" class="btn-retry">Réessayer</button>
          </div>
        } @else if (bookings().length === 0) {
          <div class="empty-state">
            <app-icon name="Calendar" class="empty-icon" />
            <p class="empty-title">Aucune réservation</p>
            <p class="empty-text">Les réservations apparaîtront ici.</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th class="cell-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                @for (booking of bookings(); track booking.id) {
                  <tr>
                    <td class="cell-bold">{{ booking.clientName }}</td>
                    <td>{{ booking.serviceName }}</td>
                    <td>
                      <span class="cell-with-icon">
                        <app-icon name="Calendar" class="icon-xs" />
                        {{ booking.startAt | date:'dd/MM/yyyy HH:mm' }}
                      </span>
                    </td>
                    <td>
                      <span class="status-chip" [class]="statusClass(booking.status)">
                        {{ booking.status }}
                      </span>
                    </td>
                    <td class="cell-right cell-bold">{{ booking.price }}€</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mobile-cards">
            @for (booking of bookings(); track booking.id) {
              <div class="data-card">
                <div class="data-card-header">
                  <div>
                    <p class="card-title">{{ booking.clientName }}</p>
                    <p class="card-meta">{{ booking.serviceName }}</p>
                  </div>
                  <span class="status-chip" [class]="statusClass(booking.status)">
                    {{ booking.status }}
                  </span>
                </div>
                <div class="data-card-footer">
                  <span class="cell-with-icon">
                    <app-icon name="Calendar" class="icon-xs" />
                    {{ booking.startAt | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                  <span class="card-price">{{ booking.price }}€</span>
                </div>
              </div>
            }
          </div>

          <div class="pagination">
            <p class="page-info">Page {{ store.currentPage() }} / {{ store.totalPages() }}</p>
            <div class="page-actions">
              <button (click)="prevPage()" [disabled]="store.currentPage() <= 1" class="btn-page">
                <app-icon name="ChevronLeft" class="icon-sm" />
                Précédent
              </button>
              <button (click)="nextPage()" [disabled]="store.currentPage() >= store.totalPages()" class="btn-page">
                Suivant
                <app-icon name="ArrowRight" class="icon-sm" />
              </button>
            </div>
          </div>
        }
      </main>
    </div>
  `,
})
export class BookingsTableComponent {
  protected readonly store = inject(AdminStore);

  protected readonly bookings = computed<BookingRow[]>(() =>
    (this.store.bookings() as Record<string, unknown>[]).map((b) => ({
      id: b['id'] as string,
      clientName: (() => {
        const c = b['client'] as { firstName?: string; lastName?: string } | undefined;
        return c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '—' : '—';
      })(),
      serviceName: (b['service'] as { name?: string } | undefined)?.name ?? '—',
      startAt: b['startAt'] as string,
      status: b['status'] as string,
      price: (b['service'] as { price?: number } | undefined)?.price ?? 0,
    }))
  );

  constructor() {
    this.store.loadBookings({ page: 1 });
  }

  protected statusClass(status: string): string {
    return STATUS_STYLES[status] ?? 'status-chip-default';
  }

  protected prevPage(): void {
    const current = this.store.currentPage();
    if (current > 1) this.store.loadBookings({ page: current - 1 });
  }

  protected nextPage(): void {
    const current = this.store.currentPage();
    if (current < this.store.totalPages()) this.store.loadBookings({ page: current + 1 });
  }
}
