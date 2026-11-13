# 🗺️ Mapa Musical Córdoba: Web GIS de la Música en la Ciudad

[![Render](https://img.shields.io/badge/Render-desplegado-46e3b7)](https://mapa-musical-cordoba.onrender.com)
![Angular 20](https://img.shields.io/badge/Angular-20-dd0031)
![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Leaflet 1.9](https://img.shields.io/badge/Leaflet-1.9-199900)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-ODbL-7ebc6f)

> 🌐 [**Ver la demo**](https://mapa-musical-cordoba.onrender.com): desplegada en Render.
>
> 📋 [**Ver el análisis funcional**](docs/analisis-funcional.md): perfiles de usuario, historias de usuario y criterios de aceptación.

## 📋 Descripción del Proyecto
Mapa Musical Córdoba es un mapa web interactivo (Web GIS) que muestra los **conservatorios, escuelas de música y salas de concierto de Córdoba** en capas geográficas que se pueden activar y desactivar. Está pensado para estudiantes y familias que buscan dónde estudiar música o danza, para músicos que buscan salas de su estilo y para visitantes que quieren descubrir la música en directo de la ciudad, por ejemplo el flamenco.

> [!NOTE]
> Los conservatorios y las salas se cargan desde ficheros GeoJSON con datos de OpenStreetMap, y las escuelas de música desde una API REST. Así la aplicación combina los dos orígenes de datos habituales en un visor GIS.

## ✨ Características Principales
- **Mapa Base Intercambiable**: OpenStreetMap estándar, OSM Humanitario y la **ortofoto PNOA** servida por el **WMS del IGN**.
- **Tres Capas Temáticas**: conservatorios, escuelas de música y salas de concierto, que se activan y desactivan desde el panel, con su número de elementos y el origen del dato.
- **Fichas de Información**: tipo, dirección, ámbito, titularidad, teléfono, web oficial, enlace «Cómo llegar» y enlace al elemento en OpenStreetMap.
- **Búsqueda**: por nombre, tipo o dirección, sin distinguir mayúsculas ni tildes.
- **Filtro por Ámbito Musical**: clásica, danza, flamenco, jazz, pop/rock y multidisciplinar, combinable con la búsqueda y las capas.
- **Resultados Sincronizados con el Mapa**: al pulsar un lugar, el mapa vuela hasta él y abre su ficha. El botón «Ajustar a resultados» encuadra los lugares visibles.
- **Tolerancia a Fallos**: si la API REST no responde, las escuelas se cargan de una copia local y el panel lo indica.
- **Diseño Responsive**: adaptado a móvil y escritorio.

## 🛠️ Tecnologías Utilizadas
- **Frontend**: Angular 20 (componentes standalone, signals y `computed()`), TypeScript, RxJS
- **Mapas**: Leaflet, OpenStreetMap, WMS del IGN (PNOA)
- **Datos**: GeoJSON (EPSG:4326), Overpass API, geocodificación con CartoCiudad (IGN)
- **API REST**: simulada con json-server, con el contrato de un backend Java/Spring Boot
- **Tests**: Karma y Jasmine
- **Despliegue**: Render (sitio estático)
- **Control de versiones**: Git

## 📦 Requisitos Previos
- Node.js 20+ y npm
- Git

## 📁 Estructura del Proyecto
```text
mapa-musical-cordoba/
├── src/app/
│   ├── core/
│   │   ├── lugar.model.ts       # Modelo: Lugar = Feature<Point> GeoJSON, DTO de la API y catálogos
│   │   ├── lugares.service.ts   # Acceso a datos: GeoJSON (HttpClient) y API REST con respaldo
│   │   ├── lugares.store.ts     # Estado con signals: capas, filtros, búsqueda y selección
│   │   └── api-url.token.ts     # URL de la API según el entorno
│   ├── mapa/                    # Leaflet: mapa base, WMS, capas, marcadores y fichas
│   └── panel/                   # Panel lateral: búsqueda, capas, filtros y resultados
├── public/data/
│   ├── conservatorios.geojson
│   ├── salas-conciertos.geojson
│   └── api/db.json              # Base de datos de la API simulada (json-server)
├── docs/
│   └── analisis-funcional.md    # Historias de usuario y criterios de aceptación
├── render.yaml                  # Configuración del despliegue (Render)
└── netlify.toml                 # Configuración alternativa (Netlify)
```

**Flujo de datos**: `LugaresService` carga las fuentes → `LugaresStore` guarda los lugares y calcula con `computed()` los resultados filtrados → `MapaComponent` y `PanelComponent` reaccionan a esos signals.

## 🗄️ Datos
| Capa | Origen | Formato |
|---|---|---|
| Conservatorios | Fichero `public/data/conservatorios.geojson` | GeoJSON |
| Salas de concierto | Fichero `public/data/salas-conciertos.geojson` | GeoJSON |
| Escuelas de música | API REST `GET /escuelas` | JSON plano con `latitud`/`longitud`, convertido a GeoJSON en el cliente |

- **Conservatorios y salas**: coordenadas y atributos extraídos de **OpenStreetMap** con la Overpass API. Cada lugar enlaza a su elemento OSM de origen. Datos © colaboradores de OpenStreetMap, bajo licencia [ODbL](https://www.openstreetmap.org/copyright).
- **Escuelas de música**: casi no están cartografiadas en OSM, así que se inventariaron a partir de sus fichas públicas y se geocodificaron con **[CartoCiudad](https://www.cartociudad.es/)** (IGN), que resuelve las direcciones a nivel de portal. El campo `precision` indica si el punto es el portal exacto (`portal`) o solo la calle (`calle`, por ejemplo en direcciones «s/n»); en la ficha, estos últimos aparecen como «ubicación aproximada».
- **Sistema de referencia**: WGS84 (EPSG:4326), con el orden de coordenadas GeoJSON `[longitud, latitud]`.

## 🔌 API REST
La API simula el contrato de un backend Java/Spring Boot. En local se sirve con json-server; en la demo publicada no hay backend y las escuelas se cargan de la copia estática (el panel muestra «Escuelas: datos estáticos (demo)»). Para conectarla a un backend real basta con cambiar la URL en `api-url.token.ts`.

```json
GET /escuelas → 200 OK
[
  {
    "id": "academia-cordoba-music",
    "nombre": "Academia Córdoba Music",
    "latitud": 37.88119,
    "longitud": -4.78767,
    "subtipo": "Academia de música",
    "ambito": "multidisciplinar"
  }
]
```

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/ecanalesn/mapa-musical-cordoba.git
cd mapa-musical-cordoba
npm install
```

### 2. Arrancar la API REST simulada
```bash
npm run api
```
API disponible en `http://localhost:3000/escuelas`. Es opcional: sin ella la aplicación funciona igual, avisa de que la API no está disponible y usa la copia local.

### 3. Arrancar la aplicación
```bash
npm start
```
Aplicación disponible en `http://localhost:4200`.

### 4. Ejecutar los tests y generar la build
```bash
npm test               # pruebas unitarias (Karma + Jasmine)
npm run build          # build de producción en dist/
```

## 🗺️ Posibles Mejoras
- Backend real en Spring Boot + PostGIS sirviendo las capas (consultas espaciales por radio o por distrito).
- Publicación de las capas como WFS en GeoServer.
- Agrupación de marcadores (clustering) y capa de distritos municipales.
- Formulario para que las escuelas soliciten su alta o corrijan sus datos, y agenda de conciertos.

**Desarrollado por**: Estefanía Canales
**Fecha**: 05/11/2026
