import type { Feature, FeatureCollection, Point } from 'geojson';

/** Capas temáticas del mapa. */
export type Categoria = 'conservatorio' | 'escuela' | 'sala';

/** Ámbito musical principal del lugar (filtro transversal a las capas). */
export type Ambito = 'clasica' | 'danza' | 'flamenco' | 'jazz' | 'pop-rock' | 'multidisciplinar';

/** Origen del dato: fichero GeoJSON estático o API REST. */
export type Fuente = 'geojson' | 'api';

export interface LugarProps {
  id: string;
  nombre: string;
  categoria: Categoria;
  subtipo: string;
  ambito: Ambito;
  direccion?: string;
  web?: string;
  telefono?: string;
  titularidad?: 'pública' | 'privada';
  /** Referencia al elemento de OpenStreetMap, p. ej. "node/123" o "way/456". */
  osm?: string;
  fuente: Fuente;
}

/** Un lugar es un Feature GeoJSON de tipo Point. Coordenadas en [lon, lat] (WGS84). */
export type Lugar = Feature<Point, LugarProps>;

/** Formato de los ficheros GeoJSON en /public/data. */
export type LugaresGeoJson = FeatureCollection<Point, Omit<LugarProps, 'fuente'>>;

/**
 * Formato JSON plano que devuelve la API REST (/escuelas).
 * Simula el DTO de un backend tipo Spring Boot: lat/lon como campos, no GeoJSON.
 */
export interface EscuelaDto {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  subtipo: string;
  ambito: Ambito;
  direccion?: string;
  web?: string;
  telefono?: string;
  titularidad?: 'pública' | 'privada';
  osm?: string;
}

export interface CategoriaInfo {
  id: Categoria;
  etiqueta: string;
  color: string;
  fuente: Fuente;
}

export const CATEGORIAS: readonly CategoriaInfo[] = [
  { id: 'conservatorio', etiqueta: 'Conservatorios', color: '#6d3fd6', fuente: 'geojson' },
  { id: 'escuela', etiqueta: 'Escuelas de música', color: '#0d8f6c', fuente: 'api' },
  { id: 'sala', etiqueta: 'Salas de concierto', color: '#d9480f', fuente: 'geojson' },
];

export const AMBITOS: readonly { id: Ambito; etiqueta: string }[] = [
  { id: 'clasica', etiqueta: 'Clásica' },
  { id: 'danza', etiqueta: 'Danza' },
  { id: 'flamenco', etiqueta: 'Flamenco' },
  { id: 'jazz', etiqueta: 'Jazz' },
  { id: 'pop-rock', etiqueta: 'Pop / Rock' },
  { id: 'multidisciplinar', etiqueta: 'Multidisciplinar' },
];

export const colorDe = (c: Categoria): string => CATEGORIAS.find((x) => x.id === c)!.color;
export const etiquetaAmbito = (a: Ambito): string => AMBITOS.find((x) => x.id === a)?.etiqueta ?? a;
