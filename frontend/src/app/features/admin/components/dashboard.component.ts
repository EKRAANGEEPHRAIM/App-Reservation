import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { AdminStore } from '../store/admin.store';

interface RecentBooking {
  id: string;
  clientName: string;
  serviceName: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'status-chip-warning',
  CONFIRMED: 'status-chip-success',
  CANCELLED: 'status-chip-danger',
  COMPLETED: 'status-chip-info',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./dashboard.component.css'],
  template: `
    <div class="dashboard-page">
      <header class="dashboard-header">
        <h1>Dashboard Admin</h1>
        <nav class="dashboard-nav">
          <a routerLink="/admin/bookings" class="nav-pill">
            <app-icon name="Calendar" class="icon-sm" />
            <span>Réservations</span>
          </a>
          <a routerLink="/admin/users" class="nav-pill">
            <app-icon name="Users" class="icon-sm" />
            <span>Utilisateurs</span>
          </a>
          <a routerLink="/" class="nav-pill">
            <app-icon name="ChevronLeft" class="icon-sm" />
            <span>Site</span>
          </a>
        </nav>
      </header>

      <main class="dashboard-content">
        @if (store.loading()) {
          <div class="loading-state">
            <app-icon name="Loader2" class="icon-lg animate-spin" />
          </div>
        } @else if (store.error()) {
          <div class="error-state">
            <app-icon name="AlertCircle" class="error-icon" />
            <p class="error-title">Une erreur est survenue</p>
            <p class="error-text">{{ store.error() }}</p>
            <button (click)="store.loadDashboard()" class="btn-retry">Réessayer</button>
          </div>
        } @else {
          <div class="stats-grid">
            <div class="stat-card stat-card-users">
              <div class="stat-header">
                <p class="stat-label">Utilisateurs</p>
                <div class="stat-icon">
                  <app-icon name="Users" class="icon-sm" />
                </div>
              </div>
              <p class="stat-value">{{ store.stats()?.totalUsers ?? 0 }}</p>
            </div>

            <div class="stat-card stat-card-bookings">
              <div class="stat-header">
                <p class="stat-label">Réservations</p>
                <div class="stat-icon">
                  <app-icon name="Calendar" class="icon-sm" />
                </div>
              </div>
              <p class="stat-value">{{ store.stats()?.totalBookings ?? 0 }}</p>
            </div>

            <div class="stat-card stat-card-revenue">
              <div class="stat-header">
                <p class="stat-label">Chiffre d'affaires</p>
                <div class="stat-icon">
                  <app-icon name="DollarSign" class="icon-sm" />
                </div>
              </div>
              <p class="stat-value">{{ store.stats()?.totalRevenue ?? 0 | number: '1.0-0' }} FCFA</p>
            </div>

            <div class="stat-card stat-card-average">
              <div class="stat-header">
                <p class="stat-label">Panier moyen</p>
                <div class="stat-icon">
                  <app-icon name="TrendingUp" class="icon-sm" />
                </div>
              </div>
              <p class="stat-value">
                @if (store.stats()?.totalBookings && store.stats()!.totalBookings > 0) {
                  {{ ((store.stats()!.totalRevenue / store.stats()!.totalBookings)).toFixed(0) }} FCFA
                } @else {
                  —
                }
              </p>
            </div>
          </div>

          <div class="recent-bookings">
            <div class="recent-header">
              <h2>Réservations récentes</h2>
              <a routerLink="/admin/bookings" class="view-all">
                Voir tout
                <app-icon name="ArrowRight" class="icon-sm" />
              </a>
            </div>
            <div class="recent-list">
              @for (booking of recentBookings(); track booking.id) {
                <div class="recent-item">
                  <div class="recent-client">
                    <div class="client-avatar">
                      <app-icon name="User" class="icon-sm" />
                    </div>
                    <div class="client-info">
                      <p class="client-name">{{ booking.clientName }}</p>
                      <p class="client-service">{{ booking.serviceName }}</p>
                    </div>
                  </div>
                  <span class="status-chip" [class]="statusClass(booking.status)">
                    {{ booking.status }}
                  </span>
                </div>
              }
              @empty {
                <div class="recent-empty">
                  <app-icon name="Calendar" class="icon-lg" />
                  <p>Aucune réservation récente</p>
                </div>
              }
            </div>
          </div>
        }
      </main>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly store = inject(AdminStore);

  protected readonly recentBookings = computed<RecentBooking[]>(() => {
    const recent = (this.store.stats()?.recentBookings ?? []) as Record<string, unknown>[];
    return recent.map((b) => ({
      id: b['id'] as string,
      clientName: (() => {
        const client = b['client'] as { firstName?: string; lastName?: string } | undefined;
        return client ? `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || '—' : '—';
      })(),
      serviceName: (b['service'] as { name?: string } | undefined)?.name ?? '—',
      status: (b['status'] as string) ?? '—',
      createdAt: b['createdAt'] as string,
    }));
  });

  constructor() {
    this.store.loadDashboard();
  }

  protected statusClass(status: string): string {
    return STATUS_STYLES[status] ?? 'status-chip-default';
  }
}
