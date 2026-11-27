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
            <p class="footer-text">{{ h.days }}&nbsp;: {{ h.time }}</p>
          }
        </div>
        <div>
          <p class="footer-title">Rendez-vous</p>
          <a routerLink="/booking/new" class="footer-link">Réserver en ligne</a>
          <a routerLink="/auth/login" class="footer-link">Espace client</a>
        </div>
      </div>
      <div class="footer-note">
        <p>Site de démonstration&nbsp;: salon fictif, paiements en mode test. Photos&nbsp;: Unsplash.</p>
        <!-- Signature commune aux projets du portfolio : monogramme AE + lien vers le portfolio -->
        <a href="https://portfolio-ange-ekra.vercel.app" target="_blank" rel="noopener" class="signature">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="6" fill="#121110"/><path fill="#E0A526" fill-rule="evenodd" d="M6 36 L14 9 H18.6 L26.6 36 H21.9 L20.2 30 H12.4 L10.7 36 Z M13.5 26 H19.1 L16.3 16 Z"/><rect x="28.5" y="9" width="4.2" height="27" fill="#F4EDE0"/><rect x="28.5" y="9" width="13.5" height="4.2" fill="#F4EDE0"/><rect x="28.5" y="20.4" width="10.5" height="4.2" fill="#C4502F"/><rect x="28.5" y="31.8" width="13.5" height="4.2" fill="#F4EDE0"/><rect x="6" y="40" width="9" height="3" fill="#E0A526"/><rect x="15" y="40" width="9" height="3" fill="#2E7D4A"/><rect x="24" y="40" width="9" height="3" fill="#C4502F"/><rect x="33" y="40" width="9" height="3" fill="#F4EDE0"/></svg>
          <span>Conçu et développé par Ange Ephraïm Ekra</span>
        </a>
      </div>
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
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2) var(--space-6);
      max-width: var(--container-xl);
      margin: var(--space-10) auto 0;
      padding-top: var(--space-4);
      font-size: var(--font-xs);
      color: var(--gray-500);
      border-top: 1px solid var(--gray-800);
    }

    .signature {
      display: inline-flex;
      align-items: center;
      min-height: 2.75rem;
      gap: var(--space-2);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--gray-300);
      text-underline-offset: 4px;
    }

    .signature:hover {
      color: var(--brand-cream);
      text-decoration: underline;
    }
  `,
})
export class SiteFooterComponent {
  protected readonly salon = SALON;
}
