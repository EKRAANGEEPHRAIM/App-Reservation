import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from './icon.component';
import { AuthStore } from '../../features/auth/store/auth.store';
import { SALON } from '../config/salon';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./site-header.component.css'],
  template: `
    <header class="site-header">
      <div class="bar">
        <a routerLink="/" class="logo" (click)="menuOpen.set(false)">
          <span class="logo-name">{{ salon.name }}</span>
          <span class="logo-sub">Coiffure · Abidjan</span>
        </a>

        <nav class="nav" [class.open]="menuOpen()" aria-label="Navigation principale">
          <a routerLink="/" fragment="prestations" (click)="menuOpen.set(false)">Prestations</a>
          <a routerLink="/" fragment="equipe" (click)="menuOpen.set(false)">L'équipe</a>
          <a routerLink="/" fragment="infos" (click)="menuOpen.set(false)">Infos pratiques</a>

          <span class="nav-sep" aria-hidden="true"></span>

          @if (auth.isAuthenticated()) {
            <a [routerLink]="accountLink().path" routerLinkActive="active" (click)="menuOpen.set(false)">
              {{ accountLink().label }}
            </a>
            <button type="button" class="link-button" (click)="logout()">Déconnexion</button>
          } @else {
            <a routerLink="/auth/login" routerLinkActive="active" (click)="menuOpen.set(false)">Connexion</a>
          }

          @if (!auth.isProvider() && !auth.isAdmin()) {
            <a routerLink="/booking/new" class="btn-brand nav-cta" (click)="menuOpen.set(false)">Prendre rendez-vous</a>
          }
        </nav>

        <button
          type="button"
          class="menu-toggle"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Ouvrir le menu"
          (click)="menuOpen.set(!menuOpen())"
        >
          <app-icon [name]="menuOpen() ? 'X' : 'Menu'" class="icon-md" />
        </button>
      </div>
    </header>
  `,
})
export class SiteHeaderComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly salon = SALON;
  protected readonly menuOpen = signal(false);

  protected readonly accountLink = computed(() => {
    if (this.auth.isAdmin()) return { path: '/admin', label: 'Administration' };
    if (this.auth.isProvider()) return { path: '/provider/bookings', label: 'Mes rendez-vous' };
    return { path: '/booking', label: 'Mes réservations' };
  });

  protected logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
