import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { ApiService } from '../../../core/services/api.service';
import { BookingStore } from '../store/booking.store';

interface Provider {
  id: string;
  bio?: string;
  category: string;
  user: { firstName: string; lastName: string; avatarUrl?: string };
  services: { id: string; name: string; price: number; durationMin: number; currency: string }[];
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./booking-form.component.css'],
  template: `
    <div class="booking-form-page">
      <header class="form-header">
        <button (click)="goBack()" class="back-button" aria-label="Retour">
          <app-icon name="ChevronLeft" class="icon-md" />
        </button>
        <h1>Nouvelle réservation</h1>
      </header>

      <main class="form-content">
        <!-- Catégorie -->
        <section class="form-section">
          <h2 class="section-title">Catégorie</h2>
          <div class="category-grid">
            @for (cat of categories; track cat.value) {
              <button
                type="button"
                (click)="selectCategory(cat.value)"
                [class.active]="selectedCategory() === cat.value"
                class="category-button"
              >
                {{ cat.label }}
              </button>
            }
          </div>
        </section>

        <!-- Prestataire -->
        @if (selectedCategory()) {
          <section class="form-section">
            <h2 class="section-title">Prestataire</h2>
            @if (loadingProviders()) {
              <div class="loading-inline">
                <div class="spinner-sm"></div>
              </div>
            } @else {
              <div class="options-list">
                @for (provider of providers(); track provider.id) {
                  <button
                    type="button"
                    (click)="selectProvider(provider)"
                    [class.active]="selectedProvider()?.id === provider.id"
                    class="option-card"
                  >
                    <p class="option-title">{{ provider.user.firstName }} {{ provider.user.lastName }}</p>
                    <p class="option-meta">{{ provider.category }}</p>
                  </button>
                }
              </div>
            }
          </section>
        }

        <!-- Service -->
        @if (selectedProvider()) {
          <section class="form-section">
            <h2 class="section-title">Service</h2>
            <div class="options-list">
              @for (service of selectedProvider()!.services; track service.id) {
                <button
                  type="button"
                  (click)="selectedServiceId.set(service.id); selectedService.set(service)"
                  [class.active]="selectedServiceId() === service.id"
                  class="service-card"
                >
                  <div>
                    <p class="option-title">{{ service.name }}</p>
                    <p class="option-meta">{{ service.durationMin }} min</p>
                  </div>
                  <p class="service-price">{{ service.price }} {{ service.currency }}</p>
                </button>
              }
            </div>
          </section>
        }

        <!-- Créneau -->
        @if (selectedServiceId()) {
          <section class="form-section">
            <h2 class="section-title">Date et heure</h2>
            <input
              type="datetime-local"
              [(ngModel)]="startAt"
              name="startAt"
              class="form-control"
            />
          </section>
        }

        <!-- Notes -->
        @if (startAt) {
          <section class="form-section">
            <h2 class="section-title">Notes (optionnel)</h2>
            <textarea
              [(ngModel)]="notes"
              name="notes"
              rows="3"
              placeholder="Informations supplémentaires pour le prestataire..."
              class="form-control form-textarea"
            ></textarea>
          </section>
        }

        @if (bookingStore.error()) {
          <div class="alert-error">{{ bookingStore.error() }}</div>
        }

        <!-- Submit -->
        @if (selectedProvider() && selectedServiceId() && startAt) {
          <button
            type="button"
            (click)="submit()"
            [disabled]="bookingStore.loading()"
            class="btn-submit"
          >
            @if (bookingStore.loading()) {
              <app-icon name="Loader2" class="icon-sm animate-spin" />
            }
            Confirmer la réservation
          </button>
        }
      </main>
    </div>
  `,
})
export class BookingFormComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly bookingStore = inject(BookingStore);

  protected readonly categories = [
    { value: 'COACHING', label: '🏋️ Coaching' },
    { value: 'BEAUTY', label: '✂️ Coiffure' },
    { value: 'MEDICAL', label: '🏥 Médical' },
  ];

  protected selectedCategory = signal<string>('');
  protected providers = signal<Provider[]>([]);
  protected loadingProviders = signal(false);
  protected selectedProvider = signal<Provider | null>(null);
  protected selectedServiceId = signal<string>('');
  protected selectedService = signal<Provider['services'][0] | null>(null);
  protected startAt = '';
  protected notes = '';

  protected selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.selectedProvider.set(null);
    this.selectedServiceId.set('');
    this.loadingProviders.set(true);

    this.api.get<Provider[]>('/users/providers', { category }).subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.loadingProviders.set(false);
      },
      error: () => this.loadingProviders.set(false),
    });
  }

  protected selectProvider(provider: Provider): void {
    this.selectedProvider.set(provider);
    this.selectedServiceId.set('');
  }

  protected submit(): void {
    const provider = this.selectedProvider();
    if (!provider || !this.selectedServiceId() || !this.startAt) return;

    this.bookingStore.createBooking({
      providerId: provider.id,
      serviceId: this.selectedServiceId(),
      startAt: new Date(this.startAt).toISOString(),
      notes: this.notes || undefined,
    });

    void this.router.navigate(['/booking']);
  }

  protected goBack(): void {
    void this.router.navigate(['/booking']);
  }
}
