import { InjectionToken, isDevMode } from '@angular/core';

/**
 * URL base de la API REST.
 * - En desarrollo apunta a json-server (`npm run api`, puerto 3000).
 * - En producción (p. ej. GitHub Pages) no hay backend: se usan los datos de respaldo.
 */
export const API_URL = new InjectionToken<string | null>('API_URL', {
  providedIn: 'root',
  factory: () => (isDevMode() ? 'http://localhost:3000' : null),
});
