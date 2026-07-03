import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../core/components/icon.component';
import { AuthStore } from '../auth/store/auth.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./home.component.css'],
  template: `
    <div class="home-page">
      <nav class="navbar">
        <div class="brand">ReserveApp</div>
        <div class="nav-actions">
          @if (authStore.isAuthenticated()) {
            <span class="user-name">{{ authStore.fullName() }}</span>
            <a routerLink="/booking" class="btn-primary">Mes réservations</a>
            @if (authStore.isAdmin()) {
              <a routerLink="/admin" class="nav-link">Admin</a>
            }
            <button (click)="authStore.logout()" class="nav-link nav-link-danger">Déconnexion</button>
          } @else {
            <a routerLink="/auth/login" class="nav-link">Se connecter</a>
            <a routerLink="/auth/register" class="btn-primary">S'inscrire</a>
          }
        </div>
      </nav>

      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">
            Réservez vos rendez-vous<br/>
            <span class="hero-accent">en quelques clics</span>
          </h1>
          <p class="hero-description">
            Coaching, coiffure, médical — trouvez le prestataire idéal et réservez directement en ligne avec paiement sécurisé.
          </p>
          <div class="hero-buttons">
            <a routerLink="/auth/register" class="btn-cta">
              Commencer gratuitement
              <app-icon name="ArrowRight" class="icon-sm" />
            </a>
            <a routerLink="/auth/login" class="btn-outline">Se connecter</a>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-grid">
          <article class="feature-card">
            <div class="feature-icon feature-icon-primary">
              <app-icon name="Calendar" class="icon-md" />
            </div>
            <h3 class="feature-title">Calendrier intelligent</h3>
            <p class="feature-text">Visualisez les disponibilités en temps réel et choisissez votre créneau idéal.</p>
          </article>

          <article class="feature-card">
            <div class="feature-icon feature-icon-success">
              <app-icon name="CreditCard" class="icon-md" />
            </div>
            <h3 class="feature-title">Paiement sécurisé</h3>
            <p class="feature-text">Payez en toute confiance via Stripe. Vos données bancaires sont protégées.</p>
          </article>

          <article class="feature-card">
            <div class="feature-icon feature-icon-purple">
              <app-icon name="Shield" class="icon-md" />
            </div>
            <h3 class="feature-title">Prestataires vérifiés</h3>
            <p class="feature-text">Tous nos prestataires sont contrôlés et évalués par notre communauté.</p>
          </article>
        </div>
      </section>
    </div>
  `,
})
export class HomeComponent {
  protected readonly authStore = inject(AuthStore);
}
