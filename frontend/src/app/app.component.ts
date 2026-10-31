import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './features/auth/store/auth.store';
import { SiteHeaderComponent } from './core/components/site-header.component';
import { SiteFooterComponent } from './core/components/site-footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  template: `
    <app-site-header />
    <main class="app-main">
      <router-outlet />
    </main>
    <app-site-footer />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .app-main {
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    // Après un rechargement, l'en-tête affiche tout de suite le bon compte
    inject(AuthStore).restoreSession().subscribe();
  }
}
