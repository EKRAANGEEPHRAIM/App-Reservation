import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { IconComponent } from '../../core/components/icon.component';
import { SALON, SALON_IMAGES, formatDuration, formatPrice } from '../../core/config/salon';
import { SalonService } from '../../core/services/salon.service';
import { Stylist, initials, stylistName } from '../../core/models/salon.models';

type StylistsState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; stylists: Stylist[] };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./home.component.css'],
  template: `
    <!-- Accroche -->
    <section class="hero" [style.background-image]="'url(' + images.hero + ')'">
      <div class="hero-inner">
        <span class="eyebrow eyebrow-light">Cocody · Abidjan</span>
        <h1>L'art de la tresse et du soin, sur rendez-vous.</h1>
        <p class="hero-text">
          Tresses, nattes, coupe et soins des cheveux naturels. Choisissez votre prestation,
          votre coiffeuse et votre horaire en moins d'une minute.
        </p>
        <div class="hero-actions">
          <a routerLink="/booking/new" class="btn-brand btn-hero">Prendre rendez-vous</a>
          <a routerLink="/" fragment="prestations" class="btn-ghost">Voir les tarifs</a>
        </div>
        <ul class="hero-facts">
          <li><app-icon name="Clock" class="icon-sm" /> Mardi – samedi, 9h – 19h</li>
          <li><app-icon name="CreditCard" class="icon-sm" /> Paiement en ligne ou au salon</li>
        </ul>
      </div>
    </section>

    <!-- Prestations et tarifs -->
    <section id="prestations" class="section">
      <div class="section-head">
        <span class="eyebrow">Prestations & tarifs</span>
        <h2>Des prix clairs, affichés avant de réserver</h2>
      </div>

      @switch (state().status) {
        @case ('loading') {
          <p class="muted center">Chargement des prestations… (le premier chargement peut prendre 30 secondes)</p>
        }
        @case ('error') {
          <p class="muted center">Les prestations ne sont pas disponibles pour le moment. Réessayez dans un instant.</p>
        }
        @case ('ready') {
          <div class="menu">
            @for (stylist of stylists(); track stylist.id) {
              <div class="menu-group">
                <h3 class="menu-title">Avec {{ name(stylist) }}</h3>
                <p class="menu-by">{{ stylist.bio }}</p>
                @for (service of stylist.services; track service.id) {
                  <a
                    class="menu-item"
                    routerLink="/booking/new"
                    [queryParams]="{ provider: stylist.id, service: service.id }"
                  >
                    <div class="menu-line">
                      <span class="menu-name">{{ service.name }}</span>
                      <span class="menu-dots" aria-hidden="true"></span>
                      <span class="menu-price">{{ price(service.price, service.currency) }}</span>
                    </div>
                    <p class="menu-desc">{{ service.description }} · {{ duration(service.durationMin) }}</p>
                  </a>
                }
              </div>
            }
          </div>
        }
      }
    </section>

    <!-- Le salon -->
    <section class="split">
      <img class="split-img" [src]="images.interior" alt="Intérieur du salon : fauteuils et miroirs ronds" loading="lazy" />
      <div class="split-text">
        <span class="eyebrow">Le salon</span>
        <h2>Ici, on ne patiente pas deux heures sur le banc.</h2>
        <ul class="checks">
          <li><app-icon name="Check" class="icon-sm" /> Un horaire réservé est un horaire tenu : pas d'attente sur place.</li>
          <li><app-icon name="Check" class="icon-sm" /> Des produits choisis pour les cheveux crépus, frisés et défrisés.</li>
          <li><app-icon name="Check" class="icon-sm" /> Confirmation de votre coiffeuse dès qu'elle valide la demande.</li>
        </ul>
        <a routerLink="/booking/new" class="btn-brand">Réserver mon créneau</a>
      </div>
    </section>

    <!-- Équipe -->
    <section id="equipe" class="section">
      <div class="section-head">
        <span class="eyebrow">L'équipe</span>
        <h2>Chacun son métier, chacun son fauteuil</h2>
      </div>
      @if (state().status === 'ready') {
        <div class="team">
          @for (stylist of stylists(); track stylist.id) {
            <article class="member">
              <div class="avatar">{{ initials(stylist) }}</div>
              <h3>{{ name(stylist) }}</h3>
              <p class="member-bio">{{ stylist.bio }}</p>
              <a
                routerLink="/booking/new"
                [queryParams]="{ provider: stylist.id }"
                class="member-link"
              >
                Réserver avec {{ stylist.user.firstName }}
                <app-icon name="ArrowRight" class="icon-sm" />
              </a>
            </article>
          }
        </div>
      }
    </section>

    <!-- Galerie -->
    <section class="gallery" aria-label="Réalisations">
      <img [src]="images.braids" alt="Queue de cheval tressée, de profil" loading="lazy" />
      <div class="gallery-quote">
        <p>« Des coiffures protectrices qui tiennent, réalisées dans le respect de vos cheveux. »</p>
        <span>— Awa Koné, fondatrice</span>
      </div>
      <img [src]="images.locs" alt="Portrait d'une femme aux longues locks" loading="lazy" />
    </section>

    <!-- Comment ça marche -->
    <section class="section steps-section">
      <div class="section-head">
        <span class="eyebrow">Réserver en ligne</span>
        <h2>Réserver prend moins de temps qu'un shampoing</h2>
      </div>
      <ol class="steps">
        <li><span class="step-num">1</span><h3>Choisissez</h3><p>La prestation et la coiffeuse qui vous conviennent.</p></li>
        <li><span class="step-num">2</span><h3>Réservez</h3><p>Un horaire parmi les créneaux réellement libres.</p></li>
        <li><span class="step-num">3</span><h3>Venez</h3><p>Payez en ligne maintenant, ou au salon le jour J.</p></li>
      </ol>
    </section>

    <!-- Infos pratiques -->
    <section id="infos" class="infos">
      <div class="infos-card">
        <span class="eyebrow eyebrow-light">Infos pratiques</span>
        <h2>Nous trouver</h2>
        <ul class="infos-list">
          <li><app-icon name="MapPin" class="icon-sm" /> {{ salon.address }}</li>
          <li><app-icon name="Phone" class="icon-sm" /> {{ salon.phone }}</li>
          @for (h of salon.hours; track h.days) {
            <li><app-icon name="Clock" class="icon-sm" /> <strong>{{ h.days }}</strong> — {{ h.time }}</li>
          }
        </ul>
        <a routerLink="/booking/new" class="btn-brand btn-light">Prendre rendez-vous</a>
      </div>
    </section>
  `,
})
export class HomeComponent {
  private readonly salonService = inject(SalonService);

  protected readonly salon = SALON;
  protected readonly images = SALON_IMAGES;

  protected readonly state = toSignal(
    this.salonService.stylists$.pipe(
      map((stylists): StylistsState => ({ status: 'ready', stylists })),
      catchError(() => of<StylistsState>({ status: 'error' })),
    ),
    { initialValue: { status: 'loading' } as StylistsState },
  );

  protected stylists(): Stylist[] {
    const s = this.state();
    return s.status === 'ready' ? s.stylists : [];
  }

  protected readonly price = formatPrice;
  protected readonly duration = formatDuration;
  protected readonly initials = initials;
  protected readonly name = stylistName;
}
