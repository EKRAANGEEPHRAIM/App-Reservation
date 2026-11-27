import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { AuthStore } from '../store/auth.store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./register.component.css'],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Créer mon compte</h1>
          <p class="auth-subtitle">Pour réserver et retrouver vos rendez-vous chez Maison Awa</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="name-fields">
            <div class="form-group">
              <label class="form-label" for="register-first-name">Prénom</label>
              <input
                id="register-first-name"
                type="text" [(ngModel)]="firstName" name="firstName" required
                autocomplete="given-name"
                class="form-input"
                placeholder="Aya"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="register-last-name">Nom</label>
              <input
                id="register-last-name"
                type="text" [(ngModel)]="lastName" name="lastName" required
                autocomplete="family-name"
                class="form-input"
                placeholder="Koné"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="register-email">Email</label>
            <input
              id="register-email"
              type="email" [(ngModel)]="email" name="email" required
              autocomplete="email"
              class="form-input"
              placeholder="votre@email.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="register-password">Mot de passe</label>
            <input
              id="register-password"
              type="password" [(ngModel)]="password" name="password" required minlength="8"
              autocomplete="new-password"
              aria-describedby="register-password-hint"
              class="form-input"
              placeholder="Min. 8 caractères"
            />
            <span id="register-password-hint" class="visually-hidden">8 caractères minimum.</span>
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
            Créer mon compte
          </button>
        </form>

        <p class="auth-footer">
          Déjà un compte ?
          <a routerLink="/auth/login" [queryParams]="{ returnUrl: returnUrl() }" class="auth-link">Se connecter</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  protected readonly authStore = inject(AuthStore);

  protected firstName = '';
  protected lastName = '';
  protected email = '';
  protected password = '';

  /** Page à rouvrir après l'inscription (ex. : le récapitulatif de réservation) */
  readonly returnUrl = input<string>();

  protected onSubmit(): void {
    if (!this.email || !this.password || !this.firstName || !this.lastName) return;
    this.authStore.register({
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      returnUrl: this.returnUrl(),
    });
  }
}
