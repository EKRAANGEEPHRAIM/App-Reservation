import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
          <h1 class="auth-title">Créer un compte</h1>
          <p class="auth-subtitle">Rejoignez notre plateforme</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="name-fields">
            <div class="form-group">
              <label class="form-label">Prénom</label>
              <input
                type="text" [(ngModel)]="firstName" name="firstName" required
                class="form-input"
                placeholder="Jean"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Nom</label>
              <input
                type="text" [(ngModel)]="lastName" name="lastName" required
                class="form-input"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              type="email" [(ngModel)]="email" name="email" required
              class="form-input"
              placeholder="votre@email.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <input
              type="password" [(ngModel)]="password" name="password" required minlength="8"
              class="form-input"
              placeholder="Min. 8 caractères"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Je suis</label>
            <select
              [(ngModel)]="role" name="role"
              class="form-select"
            >
              <option value="CLIENT">Client — Je prends des rendez-vous</option>
              <option value="PROVIDER">Prestataire — Je propose des services</option>
            </select>
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
          Déjà un compte ?
          <a routerLink="/auth/login" class="auth-link">Se connecter</a>
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
  protected role: 'CLIENT' | 'PROVIDER' = 'CLIENT';

  protected onSubmit(): void {
    if (!this.email || !this.password || !this.firstName || !this.lastName) return;
    this.authStore.register({
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
    });
  }
}
