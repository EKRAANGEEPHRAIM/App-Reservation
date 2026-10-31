import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SALON } from '../config/salon';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <p class="footer-logo">{{ salon.name }}</p>
          <p class="footer-text">{{ salon.tagline }}</p>
        </div>
        <div>
          <p class="footer-title">Nous trouver</p>
          <p class="footer-text">{{ salon.address }}</p>
          <p class="footer-text">{{ salon.phone }}</p>
        </div>
        <div>
          <p class="footer-title">Horaires</p>
          @for (h of salon.hours; track h.days) {
            <p class="footer-text">{{ h.days }} : {{ h.time }}</p>
          }
        </div>
        <div>
          <p class="footer-title">Rendez-vous</p>
          <a routerLink="/booking/new" class="footer-link">Réserver en ligne</a>
          <a routerLink="/auth/login" class="footer-link">Espace client</a>
        </div>
      </div>
      <p class="footer-note">
        Site de démonstration : salon fictif, paiements en mode test. Photos : Unsplash.
      </p>
    </footer>
  `,
  styles: `
    .site-footer {
      padding: var(--space-12) var(--space-6) var(--space-6);
      background-color: var(--brand-ink);
      color: var(--gray-300);
    }

    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: var(--space-8);
      max-width: var(--container-xl);
      margin: 0 auto;
    }

    .footer-logo {
      font-family: var(--font-display);
      font-size: var(--font-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--brand-cream);
    }

    .footer-title {
      margin-bottom: var(--space-2);
      font-size: var(--font-xs);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--primary-300);
    }

    .footer-text,
    .footer-link {
      display: block;
      font-size: var(--font-sm);
      line-height: 1.8;
    }

    .footer-link:hover {
      color: var(--brand-cream);
    }

    .footer-note {
      max-width: var(--container-xl);
      margin: var(--space-10) auto 0;
      padding-top: var(--space-4);
      font-size: var(--font-xs);
      color: var(--gray-500);
      border-top: 1px solid var(--gray-800);
    }
  `,
})
export class SiteFooterComponent {
  protected readonly salon = SALON;
}
