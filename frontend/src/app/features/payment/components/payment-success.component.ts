import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./payment-success.component.css'],
  template: `
    <div class="success-page">
      <div class="success-card">
        <div class="success-icon">
          <app-icon name="CheckCircle2" class="icon-lg" />
        </div>
        <h1 class="success-title">Paiement réussi !</h1>
        <p class="success-text">Votre réservation est confirmée. Vous recevrez un email de confirmation.</p>
        <a routerLink="/booking" class="btn-primary">Voir mes réservations</a>
      </div>
    </div>
  `,
})
export class PaymentSuccessComponent {}
