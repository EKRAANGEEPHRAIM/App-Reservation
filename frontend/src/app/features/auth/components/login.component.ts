import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { AuthStore } from '../store/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./login.component.css'],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Connexion</h1>
          <p class="auth-subtitle">Accédez à vos rendez-vous chez Maison Awa</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email</label>
            <div class="input-wrapper">
              <app-icon name="Mail" class="input-icon" />
              <input
                id="login-email"
                type="email"
                [(ngModel)]="email"
                name="email"
                autocomplete="email"
                required
                class="form-input"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Mot de passe</label>
            <div class="input-wrapper">
              <app-icon name="Lock" class="input-icon" />
              <input
                id="login-password"
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
                required
                class="form-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="input-toggle"
                [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                [attr.aria-pressed]="showPassword()"
              >
                <app-icon [name]="showPassword() ? 'EyeOff' : 'Eye'" class="icon-sm" />
              </button>
            </div>
          </div>

          @if (authStore.error()) {
            <div class="alert-error">
              {{ authStore.error() }}
            </div>
          }

          <button
            type="submit"
            [disabled]="authStore.loading()"
            class="btn-submit"
          >
            @if (authStore.loading()) {
              <app-icon name="Loader2" class="icon-sm animate-spin" />
            }
            Se connecter
          </button>
        </form>

        <p class="auth-footer">
          Pas encore de compte ?
          <a routerLink="/auth/register" [queryParams]="{ returnUrl: returnUrl() }" class="auth-link">S'inscrire</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly authStore = inject(AuthStore);

  protected email = '';
  protected password = '';
  protected showPassword = signal(false);

  /** Page à rouvrir après la connexion (ex. : le récapitulatif de réservation) */
  readonly returnUrl = input<string>();

  protected onSubmit(): void {
    if (!this.email || !this.password) return;
    this.authStore.login({ email: this.email, password: this.password, returnUrl: this.returnUrl() });
  }
}
