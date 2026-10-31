import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Dates et nombres au format français (« mar. 4 nov. », « 25 000 »)
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      // Liens d'ancre de l'en-tête (/#prestations…) et retour en haut à chaque page
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
  ],
};
