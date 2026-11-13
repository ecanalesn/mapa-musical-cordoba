import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { Ambito, Categoria, Lugar } from './lugar.model';
import { LugaresService, OrigenApi } from './lugares.service';

export interface Filtros {
  busqueda: string;
  ambitos: ReadonlySet<Ambito>;
}

/** Minúsculas y sin tildes, para que "cordoba" encuentre "Córdoba". */
export const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** Filtro por texto (nombre, subtipo, dirección) y por ámbito. No filtra por capa. */
export function filtrarLugares(lugares: readonly Lugar[], filtros: Filtros): Lugar[] {
  const q = normalizar(filtros.busqueda);
  return lugares.filter(({ properties: p }) => {
    if (filtros.ambitos.size > 0 && !filtros.ambitos.has(p.ambito)) return false;
    if (!q) return true;
    return normalizar(`${p.nombre} ${p.subtipo} ${p.direccion ?? ''}`).includes(q);
  });
}

const TODAS: Categoria[] = ['conservatorio', 'escuela', 'sala'];

/** Estado de la aplicación (signals): datos cargados, capas, filtros y selección. */
@Injectable({ providedIn: 'root' })
export class LugaresStore {
  private readonly service = inject(LugaresService);

  readonly lugares = signal<Lugar[]>([]);
  readonly cargando = signal(true);
  readonly origenApi = signal<OrigenApi | null>(null);
  readonly errores = signal<string[]>([]);

  readonly capasActivas = signal<ReadonlySet<Categoria>>(new Set(TODAS));
  readonly ambitosActivos = signal<ReadonlySet<Ambito>>(new Set());
  readonly busqueda = signal('');
  readonly seleccionadoId = signal<string | null>(null);

  /** Lugares que cumplen búsqueda y ámbito (con independencia de las capas). */
  readonly coincidentes = computed(() =>
    filtrarLugares(this.lugares(), { busqueda: this.busqueda(), ambitos: this.ambitosActivos() }),
  );

  /** Lugares visibles: coincidentes y en una capa activa, ordenados por nombre. */
  readonly visibles = computed(() =>
    this.coincidentes()
      .filter((l) => this.capasActivas().has(l.properties.categoria))
      .sort((a, b) => a.properties.nombre.localeCompare(b.properties.nombre, 'es')),
  );

  readonly conteoPorCategoria = computed(() => {
    const conteo: Record<Categoria, number> = { conservatorio: 0, escuela: 0, sala: 0 };
    for (const l of this.coincidentes()) conteo[l.properties.categoria]++;
    return conteo;
  });

  readonly seleccionado = computed(
    () => this.lugares().find((l) => l.properties.id === this.seleccionadoId()) ?? null,
  );

  readonly hayFiltros = computed(
    () => this.busqueda().trim() !== '' || this.ambitosActivos().size > 0,
  );

  cargar(): void {
    this.cargando.set(true);
    const conError = <T>(fuente: string, vacio: T) => (o: Observable<T>) =>
      o.pipe(
        catchError(() => {
          this.errores.update((e) => [...e, `No se pudo cargar ${fuente}.`]);
          return of(vacio);
        }),
      );

    forkJoin({
      conservatorios: this.service
        .cargarGeoJson('data/conservatorios.geojson')
        .pipe(conError('la capa de conservatorios', [] as Lugar[])),
      salas: this.service
        .cargarGeoJson('data/salas-conciertos.geojson')
        .pipe(conError('la capa de salas de concierto', [] as Lugar[])),
      escuelas: this.service
        .cargarEscuelas()
        .pipe(conError('la capa de escuelas de música', { lugares: [] as Lugar[], origen: null as OrigenApi | null })),
    }).subscribe(({ conservatorios, salas, escuelas }) => {
      this.lugares.set([...conservatorios, ...salas, ...escuelas.lugares]);
      this.origenApi.set(escuelas.origen);
      this.cargando.set(false);
    });
  }

  toggleCapa(c: Categoria): void {
    this.capasActivas.update((s) => alternar(s, c));
  }

  toggleAmbito(a: Ambito): void {
    this.ambitosActivos.update((s) => alternar(s, a));
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.ambitosActivos.set(new Set());
  }

  /** Selecciona un lugar; si su capa está apagada, la enciende. */
  seleccionar(id: string | null): void {
    const lugar = id ? this.lugares().find((l) => l.properties.id === id) : null;
    if (lugar && !this.capasActivas().has(lugar.properties.categoria)) {
      this.toggleCapa(lugar.properties.categoria);
    }
    this.seleccionadoId.set(lugar ? id : null);
  }
}

function alternar<T>(conjunto: ReadonlySet<T>, valor: T): ReadonlySet<T> {
  const nuevo = new Set(conjunto);
  if (!nuevo.delete(valor)) nuevo.add(valor);
  return nuevo;
}
