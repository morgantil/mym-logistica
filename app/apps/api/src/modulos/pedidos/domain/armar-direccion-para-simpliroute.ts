import { CabaProvincia } from "@mym/shared-types";

// Caso real 2026-09-04: mandar solo el barrio ("Balcarce 594, Monserrat")
// no le alcanzó al geocodificador de SimpliRoute para desambiguar una calle
// que existe en más de una provincia — igual geocodificó en San Luis. En
// vez de armar un diccionario propio de barrios porteños (mantenimiento
// nuestro, y no ayuda con localidades de GBA que también pueden ser
// ambiguas), se reutiliza la clasificación CABA/Provincia que ya resuelve
// `GeorefArAdapter` con la API oficial `georef-ar-api` — la misma que se
// usa para la zona tarifaria — para agregar el contexto que le falta.
export function armarDireccionParaSimpliRoute(
  direccionUsada: string,
  localidad: string,
  clasificacion: CabaProvincia | null,
): string {
  if (clasificacion === CabaProvincia.CABA) {
    return `${direccionUsada}, ${localidad}, CABA, Argentina`;
  }
  if (clasificacion === CabaProvincia.PROVINCIA) {
    return `${direccionUsada}, ${localidad}, Provincia de Buenos Aires, Argentina`;
  }
  // Sin clasificación posible (API caída, dirección no reconocida): se
  // mantiene el comportamiento anterior, mejor que nada.
  return `${direccionUsada}, ${localidad}`;
}
