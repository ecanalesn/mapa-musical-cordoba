import { Lugar, LugarProps } from './lugar.model';
import { filtrarLugares, normalizar } from './lugares.store';
import { dtoALugar } from './lugares.service';

const lugar = (p: Partial<LugarProps> & Pick<LugarProps, 'id' | 'nombre'>): Lugar => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-4.78, 37.88] },
  properties: { categoria: 'sala', subtipo: 'Teatro', ambito: 'multidisciplinar', fuente: 'geojson', ...p },
});

const datos: Lugar[] = [
  lugar({ id: 'a', nombre: 'Teatro Góngora', direccion: 'C/ Jesús y María, 10' }),
  lugar({ id: 'b', nombre: 'Centro Flamenco Fosforito', subtipo: 'Centro de flamenco', ambito: 'flamenco' }),
  lugar({ id: 'c', nombre: 'Conservatorio Superior', categoria: 'conservatorio', ambito: 'clasica' }),
];

describe('normalizar', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizar('  Córdoba MÚSICA ')).toBe('cordoba musica');
  });
});

describe('filtrarLugares', () => {
  it('sin filtros devuelve todos', () => {
    expect(filtrarLugares(datos, { busqueda: '', ambitos: new Set() }).length).toBe(3);
  });

  it('busca por nombre ignorando tildes', () => {
    const r = filtrarLugares(datos, { busqueda: 'gongora', ambitos: new Set() });
    expect(r.map((l) => l.properties.id)).toEqual(['a']);
  });

  it('busca también en la dirección', () => {
    const r = filtrarLugares(datos, { busqueda: 'jesus y maria', ambitos: new Set() });
    expect(r.map((l) => l.properties.id)).toEqual(['a']);
  });

  it('filtra por ámbito', () => {
    const r = filtrarLugares(datos, { busqueda: '', ambitos: new Set(['flamenco', 'clasica'] as const) });
    expect(r.map((l) => l.properties.id)).toEqual(['b', 'c']);
  });

  it('combina búsqueda y ámbito', () => {
    const r = filtrarLugares(datos, { busqueda: 'teatro', ambitos: new Set(['flamenco'] as const) });
    expect(r).toEqual([]);
  });
});

describe('dtoALugar', () => {
  it('convierte el DTO de la API en un Feature GeoJSON con coordenadas [lon, lat]', () => {
    const f = dtoALugar({
      id: 'x',
      nombre: 'Escuela',
      latitud: 37.88,
      longitud: -4.78,
      subtipo: 'Academia',
      ambito: 'jazz',
    });
    expect(f.geometry.coordinates).toEqual([-4.78, 37.88]);
    expect(f.properties.categoria).toBe('escuela');
    expect(f.properties.fuente).toBe('api');
    expect('latitud' in f.properties).toBeFalse();
  });
});
