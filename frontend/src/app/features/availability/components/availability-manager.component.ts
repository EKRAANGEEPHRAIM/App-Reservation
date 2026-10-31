import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../core/components/icon.component';
import { ApiService } from '../../../core/services/api.service';

interface Availability {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lundi', TUESDAY: 'Mardi', WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi', FRIDAY: 'Vendredi', SATURDAY: 'Samedi', SUNDAY: 'Dimanche',
};

@Component({
  selector: 'app-availability-manager',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./availability-manager.component.css'],
  template: `
    <div class="availability-page">
      <header class="page-header">
        <a routerLink="/provider/bookings" class="btn-action">
          <app-icon name="ChevronLeft" class="icon-sm" />
          Mes rendez-vous
        </a>
        <h1>Gérer mes disponibilités</h1>
        <p>Définissez vos horaires de travail</p>
      </header>

      <main class="availability-content">
        @for (av of availabilities(); track av.id) {
          <div class="availability-item">
            <div class="availability-info">
              <p class="availability-day">{{ dayLabel(av.dayOfWeek) }}</p>
              <p class="availability-hours">{{ av.startTime }} → {{ av.endTime }}</p>
            </div>
            <button
              (click)="remove(av.id)"
              class="delete-button"
              title="Supprimer"
              aria-label="Supprimer"
            >
              <app-icon name="Trash2" class="icon-sm" />
            </button>
          </div>
        }

        <div class="add-form">
          <h2 class="add-form-title">Ajouter un créneau</h2>
          <div class="time-fields">
            <select [(ngModel)]="newDay" class="form-control">
              <option value="">Jour</option>
              @for (day of days; track day.value) {
                <option [value]="day.value">{{ day.label }}</option>
              }
            </select>
            <input type="time" [(ngModel)]="newStart" class="form-control" />
            <input type="time" [(ngModel)]="newEnd" class="form-control" />
          </div>
          <button
            type="button"
            (click)="add()"
            [disabled]="loading() || !newDay || !newStart || !newEnd"
            class="btn-add"
          >
            @if (loading()) {
              <app-icon name="Loader2" class="icon-sm animate-spin" />
            } @else {
              <app-icon name="Plus" class="icon-sm" />
            }
            Ajouter
          </button>
        </div>
      </main>
    </div>
  `,
})
export class AvailabilityManagerComponent {
  private readonly api = inject(ApiService);

  protected availabilities = signal<Availability[]>([]);
  protected loading = signal(false);

  protected newDay = '';
  protected newStart = '';
  protected newEnd = '';

  protected readonly days = Object.entries(DAY_LABELS).map(([value, label]) => ({ value, label }));

  constructor() {
    this.api.get<Availability[]>('/availability/provider/me').subscribe({
      next: (data) => this.availabilities.set(data),
    });
  }

  protected dayLabel(day: string): string {
    return DAY_LABELS[day] ?? day;
  }

  protected add(): void {
    if (!this.newDay || !this.newStart || !this.newEnd) return;
    this.loading.set(true);
    this.api.post<Availability>('/availability', {
      dayOfWeek: this.newDay,
      startTime: this.newStart,
      endTime: this.newEnd,
    }).subscribe({
      next: (av) => {
        this.availabilities.update((list) => [...list, av]);
        this.newDay = '';
        this.newStart = '';
        this.newEnd = '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected remove(id: string): void {
    this.api.delete(`/availability/${id}`).subscribe({
      next: () => this.availabilities.update((list) => list.filter((a) => a.id !== id)),
    });
  }
}
