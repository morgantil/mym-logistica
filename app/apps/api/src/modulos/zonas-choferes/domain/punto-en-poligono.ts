export interface Coordenada {
  lat: number;
  lng: number;
}

// SimpliRoute expone el polígono de cada Zone (GET /v1/zones/, ver
// Documentacion simpliroute/04 §66-71) pero no un endpoint para resolver
// "a qué zona pertenece esta dirección" — eso es lógica nuestra. Ray casting
// clásico (even-odd rule): traza un rayo horizontal desde el punto hacia la
// derecha y cuenta cuántas veces cruza los lados del polígono; impar = adentro.
// Función pura, sin dependencias — testeable sin mockear nada.
export function puntoEnPoligono(punto: Coordenada, poligono: Coordenada[]): boolean {
  let dentro = false;

  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const vi = poligono[i];
    const vj = poligono[j];

    const cruzaEnY = vi.lat > punto.lat !== vj.lat > punto.lat;
    const xInterseccion = ((vj.lng - vi.lng) * (punto.lat - vi.lat)) / (vj.lat - vi.lat) + vi.lng;

    if (cruzaEnY && punto.lng < xInterseccion) {
      dentro = !dentro;
    }
  }

  return dentro;
}

// Dado un punto y varias zonas candidatas, la primera cuyo polígono lo
// contiene. Si dos polígonos se superponen (no debería pasar con zonas bien
// dibujadas, pero SimpliRoute no lo impide), gana la que aparezca primero en
// el array — el orden lo decide quien llama.
export function encontrarZona<T extends { poligono: Coordenada[] }>(
  punto: Coordenada,
  zonas: T[],
): T | null {
  return zonas.find((zona) => puntoEnPoligono(punto, zona.poligono)) ?? null;
}
