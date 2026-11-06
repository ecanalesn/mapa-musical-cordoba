import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { LugaresStore } from '../core/lugares.store';
import { CATEGORIAS, Categoria, Lugar, etiquetaAmbito } from '../core/lugar.model';

const CENTRO_CORDOBA: L.LatLngExpression = [37.8847, -4.7792];

const ICONOS: Record<Categoria, string> = {
  conservatorio:
    '<svg viewBox="0 0 24 24"><path d="M3 9.5 12 4l9 5.5M5 11v7m4.67-7v7m4.66-7v7M19 11v7M3 20h18"/></svg>',
  escuela:
    '<svg viewBox="0 0 24 24"><path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/></svg>',
  sala:
    '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
};

const escapar = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function icono(categoria: Categoria): L.DivIcon {
  return L.divIcon({
    className: 'pin-contenedor',
    html: `<span class="pin pin--${categoria}">${ICONOS[categoria]}</span>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

function contenidoPopup({ properties: p, geometry }: Lugar): string {
  const [lon, lat] = geometry.coordinates;
  const cat = CATEGORIAS.find((c) => c.id === p.categoria)!;
  const filas = [
    p.direccion && `<dt>Dirección</dt><dd>${escapar(p.direccion)}</dd>`,
    `<dt>Ámbito</dt><dd>${escapar(etiquetaAmbito(p.ambito))}</dd>`,
    p.titularidad && `<dt>Titularidad</dt><dd>${escapar(p.titularidad)}</dd>`,
    p.telefono &&
      `<dt>Teléfono</dt><dd><a href="tel:${escapar(p.telefono.replace(/\s/g, ''))}">${escapar(p.telefono)}</a></dd>`,
    `<dt>Fuente</dt><dd>${p.fuente === 'api' ? 'API REST' : 'GeoJSON'}</dd>`,
  ].filter(Boolean);
  const enlaces = [
    p.web && `<a href="${escapar(p.web)}" target="_blank" rel="noopener">Web oficial</a>`,
    `<a href="https://www.openstreetmap.org/directions?to=${lat}%2C${lon}" target="_blank" rel="noopener">Cómo llegar</a>`,
    p.osm && `<a href="https://www.openstreetmap.org/${escapar(p.osm)}" target="_blank" rel="noopener">Ver en OSM</a>`,
  ].filter(Boolean);

  return `
    <article class="ficha">
      <p class="ficha__tipo" style="color:${cat.color}">${escapar(p.subtipo)}</p>
      <h3 class="ficha__nombre">${escapar(p.nombre)}</h3>
      <dl class="ficha__datos">${filas.join('')}</dl>
      <p class="ficha__enlaces">${enlaces.join('')}</p>
    </article>`;
}

@Component({
  selector: 'app-mapa',
  template: `
    <div #contenedor class="mapa" role="region" aria-label="Mapa de lugares musicales de Córdoba"></div>
    <button type="button" class="mapa__ajustar" (click)="ajustarVista()" [disabled]="store.visibles().length === 0">
      Ajustar a resultados
    </button>
  `,
  host: { class: 'mapa-host' },
})
export class MapaComponent {
  protected readonly store = inject(LugaresStore);
  private readonly injector = inject(Injector);
  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');

  private mapa?: L.Map;
  private readonly grupos = new Map<Categoria, L.LayerGroup>(
    CATEGORIAS.map((c) => [c.id, L.layerGroup()]),
  );
  private readonly marcadores = new Map<string, L.Marker>();
  private primeraCarga = true;
  private repintando = false;

  constructor() {
    afterNextRender(() => {
      this.iniciarMapa();
      effect(() => this.pintarMarcadores(this.store.coincidentes()), { injector: this.injector });
      effect(() => this.sincronizarCapas(this.store.capasActivas()), { injector: this.injector });
      effect(() => this.mostrarSeleccion(this.store.seleccionado()), { injector: this.injector });
    });
    inject(DestroyRef).onDestroy(() => this.mapa?.remove());
  }

  ajustarVista(): void {
    const puntos = this.store.visibles().map((l) => {
      const [lon, lat] = l.geometry.coordinates;
      return L.latLng(lat, lon);
    });
    if (this.mapa && puntos.length) {
      this.mapa.flyToBounds(L.latLngBounds(puntos), { padding: [48, 48], maxZoom: 16, duration: 0.8 });
    }
  }

  private iniciarMapa(): void {
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
    const humanitario = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, estilo <a href="https://www.hotosm.org/">HOT</a>',
    });
    // Servicio WMS público del IGN (Plan Nacional de Ortofotografía Aérea).
    const ortofoto = L.tileLayer.wms('https://www.ign.es/wms-inspire/pnoa-ma', {
      layers: 'OI.OrthoimageCoverage',
      format: 'image/jpeg',
      maxZoom: 20,
      attribution: 'Ortofoto: <a href="https://pnoa.ign.es/">PNOA</a> © Instituto Geográfico Nacional',
    });

    this.mapa = L.map(this.contenedor().nativeElement, {
      center: CENTRO_CORDOBA,
      zoom: 14,
      layers: [osm],
      zoomControl: false,
    });
    L.control.zoom({ position: 'topright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(this.mapa);
    L.control
      .layers(
        {
          'OpenStreetMap': osm,
          'OpenStreetMap Humanitario': humanitario,
          'Ortofoto PNOA (WMS · IGN)': ortofoto,
        },
        undefined,
        { position: 'topright' },
      )
      .addTo(this.mapa);
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(this.mapa);
  }

  /** Reconstruye los marcadores de cada capa a partir de los lugares filtrados. */
  private pintarMarcadores(lugares: Lugar[]): void {
    // Al quitar marcadores se cierran sus popups: no debe perderse la selección por ello.
    this.repintando = true;
    this.grupos.forEach((g) => g.clearLayers());
    this.marcadores.clear();
    this.repintando = false;

    for (const lugar of lugares) {
      const { id, categoria, nombre } = lugar.properties;
      const [lon, lat] = lugar.geometry.coordinates;
      const marcador = L.marker([lat, lon], { icon: icono(categoria), title: nombre, alt: nombre })
        .bindPopup(contenidoPopup(lugar), { maxWidth: 300, autoPanPadding: [40, 40] })
        .on('click', () => this.store.seleccionar(id))
        .on('popupclose', () => {
          if (!this.repintando && this.store.seleccionadoId() === id) this.store.seleccionar(null);
        });
      this.grupos.get(categoria)!.addLayer(marcador);
      this.marcadores.set(id, marcador);
    }

    if (this.primeraCarga && lugares.length && !untracked(this.store.cargando)) {
      this.primeraCarga = false;
      queueMicrotask(() => this.ajustarVista());
    }
    // Tras repintar, se reabre el popup del lugar seleccionado si sigue entre los filtrados.
    const sel = untracked(this.store.seleccionado);
    if (sel) this.marcadores.get(sel.properties.id)?.openPopup();
  }

  /** Activa o desactiva cada capa (LayerGroup) en el mapa. */
  private sincronizarCapas(activas: ReadonlySet<Categoria>): void {
    if (!this.mapa) return;
    for (const [categoria, grupo] of this.grupos) {
      if (activas.has(categoria)) grupo.addTo(this.mapa);
      else grupo.remove();
    }
  }

  private mostrarSeleccion(lugar: Lugar | null): void {
    if (!this.mapa || !lugar) return;
    const marcador = this.marcadores.get(lugar.properties.id);
    if (!marcador) return;
    const destino = marcador.getLatLng();
    const zoom = Math.max(this.mapa.getZoom(), 16);
    if (!this.mapa.getBounds().pad(-0.1).contains(destino) || this.mapa.getZoom() < 16) {
      this.mapa.flyTo(destino, zoom, { duration: 0.7 });
      this.mapa.once('moveend', () => marcador.openPopup());
    } else {
      marcador.openPopup();
    }
  }
}
