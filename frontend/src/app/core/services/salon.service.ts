import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from './api.service';
import { Stylist } from '../models/salon.models';

@Injectable({ providedIn: 'root' })
export class SalonService {
  private readonly api = inject(ApiService);

  /** L'équipe du salon et ses prestations, chargées une fois puis partagées entre les pages */
  readonly stylists$: Observable<Stylist[]> = this.api
    .get<Stylist[]>('/users/providers', { category: 'BEAUTY' })
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  slots(providerId: string, serviceId: string, date: string): Observable<{ date: string; slots: string[] }> {
    return this.api.get('/availability/slots', { providerId, serviceId, date });
  }
}
