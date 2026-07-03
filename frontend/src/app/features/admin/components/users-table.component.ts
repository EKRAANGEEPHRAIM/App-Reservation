import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { AdminStore } from '../store/admin.store';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'role-chip-admin',
  PROVIDER: 'role-chip-provider',
  CLIENT: 'role-chip-client',
};

const ROLE_ICONS: Record<string, string> = {
  ADMIN: 'Shield',
  PROVIDER: 'Users',
  CLIENT: 'User',
};

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./users-table.component.css'],
  template: `
    <div class="users-page">
      <header class="page-header">
        <a routerLink="/admin" class="back-link">
          <app-icon name="ChevronLeft" class="icon-sm" />
          <span>Dashboard</span>
        </a>
        <h1>Utilisateurs</h1>
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
            <button (click)="store.loadUsers({ page: store.currentPage() })" class="btn-retry">Réessayer</button>
          </div>
        } @else if (users().length === 0) {
          <div class="empty-state">
            <app-icon name="Users" class="empty-icon" />
            <p class="empty-title">Aucun utilisateur</p>
            <p class="empty-text">Les utilisateurs inscrits apparaîtront ici.</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">
                          <app-icon name="User" class="icon-xs" />
                        </div>
                        <span class="cell-bold">{{ user.name }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="cell-with-icon">
                        <app-icon name="Mail" class="icon-xs" />
                        {{ user.email }}
                      </span>
                    </td>
                    <td>
                      <span class="role-chip" [class]="roleClass(user.role)">
                        <app-icon name="{{ roleIcon(user.role) }}" class="icon-xs" />
                        {{ user.role }}
                      </span>
                    </td>
                    <td>
                      <span class="cell-with-icon">
                        <app-icon name="Calendar" class="icon-xs" />
                        {{ user.createdAt | date:'dd/MM/yyyy' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mobile-cards">
            @for (user of users(); track user.id) {
              <div class="data-card">
                <div class="data-card-header">
                  <div class="user-cell">
                    <div class="user-avatar user-avatar-lg">
                      <app-icon name="User" class="icon-sm" />
                    </div>
                    <div>
                      <p class="card-title">{{ user.name }}</p>
                      <p class="card-meta">{{ user.email }}</p>
                    </div>
                  </div>
                  <span class="role-chip" [class]="roleClass(user.role)">
                    {{ user.role }}
                  </span>
                </div>
                <div class="data-card-footer">
                  <span class="cell-with-icon">
                    <app-icon name="Calendar" class="icon-xs" />
                    Inscrit le {{ user.createdAt | date:'dd/MM/yyyy' }}
                  </span>
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
export class UsersTableComponent {
  protected readonly store = inject(AdminStore);

  protected readonly users = computed<UserRow[]>(() =>
    (this.store.users() as Record<string, unknown>[]).map((u) => ({
      id: u['id'] as string,
      name: `${u['firstName'] ?? ''} ${u['lastName'] ?? ''}`.trim() || '—',
      email: u['email'] as string,
      role: u['role'] as string,
      createdAt: u['createdAt'] as string,
    }))
  );

  constructor() {
    this.store.loadUsers({ page: 1 });
  }

  protected roleClass(role: string): string {
    return ROLE_STYLES[role] ?? 'role-chip-default';
  }

  protected roleIcon(role: string): string {
    return ROLE_ICONS[role] ?? 'User';
  }

  protected prevPage(): void {
    const current = this.store.currentPage();
    if (current > 1) this.store.loadUsers({ page: current - 1 });
  }

  protected nextPage(): void {
    const current = this.store.currentPage();
    if (current < this.store.totalPages()) this.store.loadUsers({ page: current + 1 });
  }
}
