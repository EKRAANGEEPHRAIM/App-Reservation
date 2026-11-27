import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { IconComponent } from '../../../core/components/icon.component';
import { ApiService } from '../../../core/services/api.service';
import { SalonService } from '../../../core/services/salon.service';
import { Prestation, Stylist, initials, stylistName } from '../../../core/models/salon.models';
import { formatDuration, formatPrice } from '../../../core/config/salon';
import { AuthStore } from '../../auth/store/auth.store';

type SlotsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; slots: string[] };

/** Nombre de jours proposés à partir d'aujourd'hui */
const DAYS_AHEAD = 14;

/** Date du jour au format YYYY-MM-DD, heure d'Abidjan (UTC+0) */
const isoDay = (offsetDays: number): string =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./booking-form.component.css'],
  template: `
    <div class="inner-page">
      <h1 class="inner-page-title">Prendre rendez-vous</h1>
      <p class="inner-page-lead">Choisissez votre prestation, puis un horaire libre. Aucun paiement n'est demandé avant la confirmation.</p>

      <ol class="stepper" aria-label="Étapes de la réservation">
        <li [class.current]="step() === 1" [class.done]="step() > 1">1. Prestation</li>
        <li [class.current]="step() === 2" [class.done]="step() > 2">2. Horaire</li>
        <li [class.current]="step() === 3">3. Confirmation</li>
      </ol>

      <div class="layout">
        <div class="main">
          <!-- Étape 1 : prestation et coiffeuse -->
          @if (step() === 1) {
            @if (!stylists()) {
              <p class="muted">Chargement des prestations… (le premier chargement peut prendre 30 secondes)</p>
            } @else {
              @if (provider() && visibleStylists().length === 1) {
                <button type="button" class="text-link" (click)="go({ provider: null })">
                  Voir les prestations de toute l'équipe
                </button>
              }
              @for (stylist of visibleStylists(); track stylist.id) {
                <section class="stylist-block">
                  <header class="stylist-head">
                    <div class="avatar">{{ initials(stylist) }}</div>
                    <div>
                      <h2>{{ name(stylist) }}</h2>
                      <p class="muted">{{ stylist.bio }}</p>
                    </div>
                  </header>
                  <div class="service-list">
                    @for (svc of stylist.services; track svc.id) {
                      <button type="button" class="service-option" (click)="go({ provider: stylist.id, service: svc.id, time: null })">
                        <span>
                          <span class="service-name">{{ svc.name }}</span>
                          <span class="service-meta">{{ duration(svc.durationMin) }} · {{ svc.description }}</span>
                        </span>
                        <span class="service-price">{{ price(svc.price, svc.currency) }}</span>
                      </button>
                    }
                  </div>
                </section>
              }
            }
          }

          <!-- Étape 2 : jour et heure -->
          @if (step() === 2) {
            <section>
              <h2 class="step-title">Quel jour ?</h2>
              <div class="days" role="listbox" aria-label="Jour du rendez-vous">
                @for (d of days; track d) {
                  <button
                    type="button"
                    role="option"
                    class="day"
                    [class.selected]="d === activeDate()"
                    [attr.aria-selected]="d === activeDate()"
                    (click)="go({ date: d, time: null })"
                  >
                    <span class="day-name">{{ d + 'T00:00:00Z' | date: 'EEE' : 'UTC' }}</span>
                    <span class="day-num">{{ d + 'T00:00:00Z' | date: 'd' : 'UTC' }}</span>
                    <span class="day-month">{{ d + 'T00:00:00Z' | date: 'MMM' : 'UTC' }}</span>
                  </button>
                }
              </div>

              <h2 class="step-title">À quelle heure ?</h2>
              @switch (slotsState().status) {
                @case ('loading') {
                  <p class="muted">Recherche des créneaux libres…</p>
                }
                @case ('error') {
                  <p class="alert alert-error">Impossible de charger les créneaux. Réessayez dans un instant.</p>
                }
                @case ('ready') {
                  @if (slots().length === 0) {
                    <p class="muted">Aucun créneau libre ce jour-là (salon fermé ou complet). Essayez un autre jour.</p>
                  } @else {
                    <div class="slots">
                      @for (slot of slots(); track slot) {
                        <button type="button" class="slot" (click)="go({ time: slot })">{{ slot }}</button>
                      }
                    </div>
                  }
                }
              }
              <button type="button" class="text-link back" (click)="go({ service: null, time: null })">
                <app-icon name="ChevronLeft" class="icon-sm" /> Changer de prestation
              </button>
            </section>
          }

          <!-- Étape 3 : confirmation -->
          @if (step() === 3) {
            <section>
              <h2 class="step-title">Vérifiez et confirmez</h2>
              <label class="field-label" for="notes">Un message pour {{ selectedStylist()?.user?.firstName }}&nbsp;? (facultatif)</label>
              <textarea
                id="notes"
                class="notes"
                rows="3"
                [(ngModel)]="notes"
                placeholder="Longueur souhaitée, couleur des mèches, photo d'inspiration à montrer…"
              ></textarea>

              @if (error()) {
                <p class="alert alert-error">{{ error() }}</p>
              }

              @if (auth.isAuthenticated()) {
                <div class="confirm-actions">
                  <button type="button" class="btn-brand" [disabled]="submitting()" (click)="book(true)">
                    @if (submitting() === 'pay') {
                      <app-icon name="Loader2" class="icon-sm animate-spin" />
                    } @else {
                      <app-icon name="CreditCard" class="icon-sm" />
                    }
                    Confirmer et payer en ligne
                  </button>
                  <button type="button" class="btn-outline" [disabled]="submitting()" (click)="book(false)">
                    @if (submitting() === 'later') {
                      <app-icon name="Loader2" class="icon-sm animate-spin" />
                    }
                    Confirmer, je paie au salon
                  </button>
                </div>
                <p class="fine-print">Paiement en ligne sécurisé par Stripe (mode test pour cette démo).</p>
              } @else {
                <div class="login-box">
                  <p>Connectez-vous pour confirmer : vos choix sont conservés.</p>
                  <div class="confirm-actions">
                    <a routerLink="/auth/login" [queryParams]="{ returnUrl: currentUrl() }" class="btn-brand">Se connecter</a>
                    <a routerLink="/auth/register" [queryParams]="{ returnUrl: currentUrl() }" class="btn-outline">Créer un compte</a>
                  </div>
                </div>
              }

              <button type="button" class="text-link back" (click)="go({ time: null })">
                <app-icon name="ChevronLeft" class="icon-sm" /> Changer d'horaire
              </button>
            </section>
          }
        </div>

        <!-- Récapitulatif -->
        <aside class="summary" aria-label="Votre rendez-vous">
          <p class="summary-title">Votre rendez-vous</p>
          @if (selectedService(); as svc) {
            <dl>
              <dt>Prestation</dt>
              <dd>{{ svc.name }}</dd>
              <dt>Avec</dt>
              <dd>{{ name(selectedStylist()!) }}</dd>
              <dt>Durée</dt>
              <dd>{{ duration(svc.durationMin) }}</dd>
              @if (time()) {
                <dt>Quand</dt>
                <dd class="when">{{ activeDate() + 'T00:00:00Z' | date: 'EEEE d MMMM' : 'UTC' }} à {{ time() }}</dd>
              }
            </dl>
            <p class="summary-total">
              <span>Total</span>
              <strong>{{ price(svc.price, svc.currency) }}</strong>
            </p>
          } @else {
            <p class="muted">Sélectionnez une prestation pour voir le récapitulatif.</p>
          }
          <p class="summary-note">Annulation gratuite depuis votre espace tant que le rendez-vous est en attente.</p>
        </aside>
      </div>
    </div>
  `,
})
export class BookingFormComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly salonService = inject(SalonService);
  protected readonly auth = inject(AuthStore);

  // L'état du parcours vit dans l'URL : ?provider=…&service=…&date=…&time=…
  // (il survit à la connexion et peut être partagé)
  readonly provider = input<string>();
  readonly service = input<string>();
  readonly date = input<string>();
  readonly time = input<string>();

  protected notes = '';
  protected readonly submitting = signal<'pay' | 'later' | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly days = Array.from({ length: DAYS_AHEAD }, (_, i) => isoDay(i));
  protected readonly stylists = toSignal(this.salonService.stylists$.pipe(catchError(() => of<Stylist[]>([]))));

  protected readonly visibleStylists = computed(() => {
    const all = this.stylists() ?? [];
    const only = all.filter((s) => s.id === this.provider());
    return only.length ? only : all;
  });

  protected readonly selectedStylist = computed(() => this.stylists()?.find((s) => s.id === this.provider()));
  protected readonly selectedService = computed<Prestation | undefined>(() =>
    this.selectedStylist()?.services.find((s) => s.id === this.service()),
  );

  protected readonly activeDate = computed(() => {
    const d = this.date();
    return d && this.days.includes(d) ? d : this.days[0];
  });

  protected readonly step = computed(() => {
    if (!this.selectedService()) return 1;
    if (!this.time()) return 2;
    return 3;
  });

  protected readonly slotsState = toSignal(
    toObservable(computed(() => ({ provider: this.provider(), service: this.selectedService()?.id, date: this.activeDate() }))).pipe(
      switchMap(({ provider, service, date }) =>
        !provider || !service
          ? of<SlotsState>({ status: 'idle' })
          : this.salonService.slots(provider, service, date).pipe(
              map((r): SlotsState => ({ status: 'ready', slots: r.slots })),
              catchError(() => of<SlotsState>({ status: 'error' })),
              startWith<SlotsState>({ status: 'loading' }),
            ),
      ),
    ),
    { initialValue: { status: 'idle' } as SlotsState },
  );

  protected slots(): string[] {
    const s = this.slotsState();
    return s.status === 'ready' ? s.slots : [];
  }

  protected currentUrl(): string {
    return this.router.url;
  }

  protected go(params: Partial<Record<'provider' | 'service' | 'date' | 'time', string | null>>): void {
    this.error.set(null);
    void this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  protected book(payNow: boolean): void {
    const svc = this.selectedService();
    const stylist = this.selectedStylist();
    if (!svc || !stylist || !this.time()) return;

    this.submitting.set(payNow ? 'pay' : 'later');
    this.error.set(null);

    // Heure du salon = UTC (Abidjan, UTC+0 toute l'année)
    const startAt = `${this.activeDate()}T${this.time()}:00.000Z`;

    this.api
      .post<{ id: string }>('/bookings', {
        providerId: stylist.id,
        serviceId: svc.id,
        startAt,
        notes: this.notes.trim() || undefined,
      })
      .pipe(
        switchMap((booking) =>
          payNow
            ? this.api.post<{ url: string }>('/payments/checkout', { bookingId: booking.id }).pipe(map((r) => r.url))
            : of(null),
        ),
      )
      .subscribe({
        next: (checkoutUrl) => {
          if (checkoutUrl) {
            window.location.assign(checkoutUrl);
          } else {
            void this.router.navigate(['/booking'], { queryParams: { booked: 1 } });
          }
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.submitting.set(null);
          if (err.error?.message === 'Time slot already booked') {
            this.error.set('Ce créneau vient d’être pris. Choisissez un autre horaire.');
          } else if (err.status === 401) {
            this.error.set('Votre session a expiré. Reconnectez-vous pour confirmer.');
          } else {
            this.error.set(err.error?.message ?? 'La réservation a échoué. Réessayez.');
          }
        },
      });
  }

  protected readonly price = formatPrice;
  protected readonly duration = formatDuration;
  protected readonly initials = initials;
  protected readonly name = stylistName;
}
