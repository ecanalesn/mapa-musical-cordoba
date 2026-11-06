# Mapa Musical Córdoba

Mapa web interactivo (Web GIS) que muestra los **conservatorios, escuelas de música y salas de concierto de Córdoba** en capas geográficas que se pueden activar y desactivar, con ventanas de información, filtros y búsqueda.

**Stack:** Angular 20 · TypeScript · Leaflet · OpenStreetMap · GeoJSON · API REST · JSON

## Funcionalidades

- **Mapa base** OpenStreetMap con selector de fondo: OSM estándar, OSM Humanitario y **ortofoto PNOA** servida por el **WMS del IGN**.
- **Tres capas temáticas** (`L.LayerGroup`) que se activan y desactivan desde el panel, con contador de elementos y origen del dato:
  | Capa | Origen |
  |---|---|
  | Conservatorios | Fichero **GeoJSON** (`public/data/conservatorios.geojson`) |
  | Salas de concierto | Fichero **GeoJSON** (`public/data/salas-conciertos.geojson`) |
  | Escuelas de música | **API REST** (`GET /escuelas`, JSON plano convertido a GeoJSON en el cliente) |
- **Ventanas de información** (popups) con tipo, dirección, ámbito, titularidad, teléfono, web oficial, enlace «Cómo llegar» y enlace al elemento en OpenStreetMap.
- **Búsqueda** por nombre, tipo o dirección (insensible a mayúsculas y tildes).
- **Filtro por ámbito musical** (clásica, danza, flamenco, jazz, pop/rock, multidisciplinar), combinable con la búsqueda y las capas.
- **Lista de resultados** sincronizada con el mapa: al pulsar un lugar el mapa vuela hasta él y abre su ficha.
- Botón **«Ajustar a resultados»** (encuadra los lugares visibles).
- **Tolerancia a fallos:** si la API REST no responde, las escuelas se cargan de una copia local y el panel lo indica.
- Diseño adaptable a móvil y escritorio.

## Puesta en marcha

Requisitos: Node.js 20+.

```bash
npm install
npm run api     # terminal 1 · API REST simulada en http://localhost:3000/escuelas
npm start       # terminal 2 · aplicación en http://localhost:4200
```

Sin `npm run api` la aplicación también funciona: muestra el aviso «API REST no disponible» y usa la copia local.

Otros comandos:

```bash
npm test                 # pruebas unitarias (Karma + Jasmine)
npm run build            # build de producción en dist/
npm run build:pages      # build con base-href para GitHub Pages
```

## Arquitectura

```
src/app/
├── core/
│   ├── lugar.model.ts       # Modelo: Lugar = Feature<Point> GeoJSON, DTO de la API, catálogos
│   ├── lugares.service.ts   # Acceso a datos: GeoJSON (HttpClient) y API REST con respaldo
│   ├── lugares.store.ts     # Estado con signals: capas, filtros, búsqueda, selección
│   └── api-url.token.ts     # URL de la API según entorno
├── mapa/mapa.component.ts   # Leaflet: mapa base, WMS, capas, marcadores y popups
└── panel/                   # Panel lateral: búsqueda, capas, filtros, resultados
public/data/
├── conservatorios.geojson
├── salas-conciertos.geojson
└── api/db.json              # Base de datos de la API simulada (json-server)
docs/
└── analisis-funcional.md    # Historias de usuario y criterios de aceptación
```

Flujo de datos: `LugaresService` carga las fuentes → `LugaresStore` guarda los lugares y calcula con `computed()` los resultados filtrados → `MapaComponent` y `PanelComponent` reaccionan a esos signals.

La API REST simula el contrato de un backend Java/Spring Boot: devuelve un JSON plano con `latitud`/`longitud`, y el frontend lo transforma a GeoJSON (`dtoALugar`). Para conectarla a un backend real basta con cambiar la URL en `api-url.token.ts`.

## Datos

- **Conservatorios y salas:** coordenadas y atributos extraídos de **OpenStreetMap** con la Overpass API. Cada lugar enlaza a su elemento OSM de origen. Datos © colaboradores de OpenStreetMap, bajo licencia [ODbL](https://www.openstreetmap.org/copyright).
- **Escuelas de música:** casi no están cartografiadas en OSM. Se inventariaron a partir de sus fichas públicas y se geocodificaron con **[CartoCiudad](https://www.cartociudad.es/)** (IGN), que resuelve las direcciones a nivel de portal.
  - El campo `precision` indica si el punto es el portal exacto (`portal`) o solo la calle (`calle`, por ejemplo en direcciones «s/n»).
  - En la ficha del mapa, los puntos a nivel de calle aparecen como «ubicación aproximada».
- Sistema de referencia: WGS84 (EPSG:4326); orden de coordenadas GeoJSON `[longitud, latitud]`.

## Mejoras previstas

- Backend real en Spring Boot + PostGIS sirviendo las capas (consultas espaciales por radio o por distrito).
- Publicación de las capas como WFS en GeoServer.
- Agrupación de marcadores (clustering) y capa de distritos municipales.
- Formulario para que las escuelas soliciten su alta o corrijan sus datos, y agenda de conciertos.

## Autoría

[github.com/ecanalesn](https://github.com/ecanalesn)
