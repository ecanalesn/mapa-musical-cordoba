import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, timeout } from 'rxjs';
import { API_URL } from './api-url.token';
import { EscuelaDto, Lugar, LugaresGeoJson } from './lugar.model';

/** api: datos en vivo · respaldo: la API falló · estatico: sin API configurada (producción). */
export type OrigenApi = 'api' | 'respaldo' | 'estatico';

/** Copia estática de la base de datos de json-server, usada si la API no responde. */
const RUTA_RESPALDO_API = 'data/api/db.json';

/** Convierte el DTO plano de la API en un Feature GeoJSON. */
export function dtoALugar(dto: EscuelaDto): Lugar {
  const { latitud, longitud, ...resto } = dto;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [longitud, latitud] },
    properties: { ...resto, categoria: 'escuela', fuente: 'api' },
  };
}

@Injectable({ providedIn: 'root' })
export class LugaresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  /** Carga una capa desde un fichero GeoJSON (FeatureCollection de puntos). */
  cargarGeoJson(ruta: string): Observable<Lugar[]> {
    return this.http.get<LugaresGeoJson>(ruta).pipe(
      map((fc) =>
        fc.features.map((f) => ({ ...f, properties: { ...f.properties, fuente: 'geojson' as const } })),
      ),
    );
  }

  /** Carga las escuelas desde la API REST; si falla, usa la copia de respaldo. */
  cargarEscuelas(): Observable<{ lugares: Lugar[]; origen: OrigenApi }> {
    const copiaLocal = (origen: OrigenApi) =>
      this.http.get<{ escuelas: EscuelaDto[] }>(RUTA_RESPALDO_API).pipe(
        map((db) => ({ lugares: db.escuelas.map(dtoALugar), origen })),
      );
    if (!this.apiUrl) return copiaLocal('estatico');

    return this.http.get<EscuelaDto[]>(`${this.apiUrl}/escuelas`).pipe(
      timeout(4000),
      map((dtos) => ({ lugares: dtos.map(dtoALugar), origen: 'api' as const })),
      catchError(() => copiaLocal('respaldo')),
    );
  }
}
