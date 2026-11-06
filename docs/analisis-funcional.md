# Análisis funcional · Mapa Musical Córdoba

## 1. Objetivo

Ofrecer a estudiantes, familias, músicos y público general un mapa web donde localizar la oferta de formación musical (conservatorios y escuelas) y los espacios de música en directo (salas de concierto) de Córdoba, y consultar su información básica.

## 2. Perfiles de usuario

| Perfil | Necesidad principal |
|---|---|
| Familia / estudiante | Encontrar dónde estudiar música o danza cerca de casa. |
| Músico | Localizar salas donde tocar o asistir a conciertos de su estilo. |
| Visitante | Descubrir lugares de música en directo, por ejemplo flamenco. |

## 3. Alcance (versión 1.0)

- Incluido: mapa base, 3 capas temáticas, popups, búsqueda, filtro por ámbito, lista de resultados, selector de mapa base con WMS.
- Fuera de alcance: alta y edición de lugares, agenda de conciertos, cuentas de usuario, cálculo de rutas propio.

## 4. Fuentes de datos

| Capa | Fuente | Formato | Actualización |
|---|---|---|---|
| Conservatorios | Fichero estático | GeoJSON (EPSG:4326) | Manual |
| Salas de concierto | Fichero estático | GeoJSON (EPSG:4326) | Manual |
| Escuelas de música | API REST `GET /escuelas` | JSON (DTO con `latitud`/`longitud`) | En cada carga |
| Mapa base | OpenStreetMap / WMS PNOA (IGN) | Teselas XYZ / WMS | Externa |

Contrato de la API (`GET /escuelas` → `200 OK`):

```json
[
  {
    "id": "academia-cordoba-music",
    "nombre": "Academia Córdoba Music",
    "latitud": 37.88119,
    "longitud": -4.78767,
    "subtipo": "Academia de música",
    "ambito": "multidisciplinar",
    "direccion": "C/ Virgen del Perpetuo Socorro, 2",
    "web": "https://academiacordobamusic.com/",
    "titularidad": "privada",
    "osm": "node/9447996000"
  }
]
```

Campos obligatorios: `id`, `nombre`, `latitud`, `longitud`, `subtipo`, `ambito`. `ambito` ∈ {`clasica`, `danza`, `flamenco`, `jazz`, `pop-rock`, `multidisciplinar`}.

## 5. Historias de usuario

### HU-01 · Ver los lugares en el mapa
**Como** usuario **quiero** ver en un mapa de Córdoba los conservatorios, escuelas y salas **para** hacerme una idea de dónde están.

```gherkin
Escenario: Carga inicial
  Dado que abro la aplicación
  Cuando terminan de cargarse los datos
  Entonces veo un marcador por cada lugar, con color e icono según su categoría
  Y el mapa encuadra todos los lugares
  Y el panel muestra el número de lugares de cada capa
```

### HU-02 · Activar y desactivar capas
**Como** usuario **quiero** mostrar u ocultar cada categoría **para** centrarme en lo que me interesa.

```gherkin
Escenario: Ocultar una capa
  Dado que las tres capas están activas
  Cuando desmarco "Salas de concierto"
  Entonces desaparecen del mapa los marcadores de salas
  Y desaparecen de la lista de resultados
  Y el resto de capas no cambia

Escenario: Seleccionar un lugar de una capa oculta
  Dado que la capa "Conservatorios" está desactivada
  Cuando selecciono un conservatorio
  Entonces la capa "Conservatorios" se activa automáticamente
```

### HU-03 · Consultar la información de un lugar
**Como** usuario **quiero** pulsar un marcador y ver su ficha **para** saber qué es y cómo contactar.

```gherkin
Escenario: Abrir ficha
  Cuando pulso un marcador
  Entonces se abre una ventana con: tipo, nombre, ámbito y fuente del dato
  Y, si existen, dirección, titularidad, teléfono y web oficial
  Y siempre un enlace "Cómo llegar" y otro "Ver en OSM"
  Y los campos sin dato no se muestran (no aparecen vacíos)
```

### HU-04 · Buscar por nombre o dirección
**Como** usuario **quiero** escribir un texto y filtrar los lugares **para** encontrar uno concreto rápidamente.

```gherkin
Escenario: Búsqueda sin tildes
  Cuando escribo "gongora"
  Entonces la lista y el mapa muestran "Teatro Góngora"

Escenario: Búsqueda por dirección
  Cuando escribo "jesus y maria"
  Entonces se muestra el lugar cuya dirección es "C/ Jesús y María, 10"

Escenario: Sin resultados
  Cuando escribo un texto que no coincide con ningún lugar
  Entonces la lista muestra "Ningún lugar coincide con la búsqueda y los filtros."
  Y el botón "Ajustar a resultados" queda deshabilitado
```

### HU-05 · Filtrar por ámbito musical
**Como** músico **quiero** filtrar por estilo **para** ver solo los lugares de flamenco, jazz, etc.

```gherkin
Escenario: Varios ámbitos
  Cuando activo "Flamenco" y "Jazz"
  Entonces solo se muestran lugares de ámbito flamenco o jazz (unión)
  Y los contadores de cada capa se actualizan

Escenario: Combinación con búsqueda
  Dado que tengo activo "Flamenco"
  Cuando busco "teatro"
  Entonces solo se muestran lugares que cumplen ambas condiciones (intersección)

Escenario: Limpiar filtros
  Cuando pulso "Limpiar filtros"
  Entonces se borran la búsqueda y los ámbitos, y las capas no cambian
```

### HU-06 · Ir a un lugar desde la lista
**Como** usuario **quiero** pulsar un resultado de la lista **para** verlo en el mapa.

```gherkin
Escenario: Selección desde la lista
  Cuando pulso un lugar de la lista de resultados
  Entonces el mapa se desplaza y acerca hasta él (zoom ≥ 16)
  Y se abre su ficha
  Y el elemento queda resaltado en la lista
```

### HU-07 · Cambiar el mapa base
**Como** usuario **quiero** elegir el fondo del mapa **para** ver el callejero o la ortofoto.

```gherkin
Escenario: Ortofoto
  Cuando elijo "Ortofoto PNOA (WMS · IGN)" en el selector de capas
  Entonces el fondo pasa a ser la ortofoto servida por el WMS del IGN
  Y las capas temáticas siguen visibles encima
```

### HU-08 · Funcionamiento sin API
**Como** usuario **quiero** que el mapa funcione aunque el servicio de escuelas falle **para** no quedarme sin información.

```gherkin
Escenario: API caída
  Dado que la API REST no responde en 4 segundos o devuelve error
  Cuando se cargan los datos
  Entonces las escuelas se cargan de la copia local
  Y el panel muestra "API REST no disponible · escuelas desde copia local"
  Y el resto de capas funciona con normalidad
```

### HU-09 · Uso en móvil
**Como** usuario de móvil **quiero** poder plegar el panel **para** ver el mapa a pantalla completa.

```gherkin
Escenario: Plegar panel
  Dado que uso una pantalla de menos de 760 px de ancho
  Cuando pulso "Ocultar"
  Entonces el panel muestra solo la cabecera y el mapa ocupa el resto
```

## 6. Reglas de negocio

- RN-01: un lugar pertenece a una sola categoría y a un solo ámbito principal.
- RN-02: los filtros se combinan así: (capa activa) Y (texto) Y (ámbito₁ O ámbito₂ …). Sin ámbitos marcados, se muestran todos.
- RN-03: la búsqueda ignora mayúsculas y tildes y busca en nombre, subtipo y dirección.
- RN-04: la lista de resultados se ordena alfabéticamente (orden español).
- RN-05: toda fuente externa se cita en la atribución del mapa (OSM, IGN).

## 7. Plan de pruebas funcionales

| ID | HU | Caso | Resultado esperado | Estado |
|---|---|---|---|---|
| PF-01 | HU-01 | Abrir la aplicación | 15 marcadores; contadores 3 / 1 / 11 | OK |
| PF-02 | HU-02 | Desmarcar "Salas de concierto" | Quedan 4 resultados | OK |
| PF-03 | HU-04 | Buscar "gongora" | 1 resultado: Teatro Góngora | OK (prueba unitaria) |
| PF-04 | HU-05 | Ámbito "Flamenco" | 1 resultado: Centro Flamenco Fosforito | — |
| PF-05 | HU-05 | "Flamenco" + buscar "teatro" | 0 resultados, mensaje de lista vacía | OK (prueba unitaria) |
| PF-06 | HU-08 | Arrancar sin `npm run api` | Aviso de copia local; 1 escuela visible | — |
| PF-07 | HU-09 | Ancho 390 px | Sin desplazamiento horizontal; botón "Ocultar" visible | OK |
