import { CabaProvincia } from "@mym/shared-types";
import { ClasificacionLocalidad } from "../../geografia/domain/normalizador-direcciones.port";

// Caso real 2026-09-04: mandar solo el barrio ("Balcarce 594, Monserrat")
// no le alcanzó al geocodificador de SimpliRoute para desambiguar una calle
// que existe en más de una provincia — igual geocodificó en San Luis. En
// vez de armar un diccionario propio de barrios porteños (mantenimiento
// nuestro, y no ayuda con localidades de GBA que también pueden ser
// ambiguas), se reutiliza la clasificación CABA/Provincia que ya resuelve
// `GeorefArAdapter` con la API oficial `georef-ar-api` — la misma que se
// usa para la zona tarifaria — para agregar el contexto que le falta.
//
// Caso real 2026-09-06: "Av. San Martín" existe tanto en Caseros como en
// Munro (dos partidos distintos del conurbano) y SimpliRoute geocodificó
// las dos direcciones en el mismo punto — parece confundir la calle con el
// partido homónimo "San Martín". Se agrega también el partido (ej. "Tres
// de Febrero", "Vicente López") cuando se conoce, para Provincia — CABA no
// lo necesita, sus barrios no se repiten entre sí.
export function armarDireccionParaSimpliRoute(
  direccionUsada: string,
  localidad: string,
  clasificacion: ClasificacionLocalidad | null,
): string {
  if (clasificacion?.clasificacion === CabaProvincia.CABA) {
    return `${direccionUsada}, ${localidad}, CABA, Argentina`;
  }
  if (clasificacion?.clasificacion === CabaProvincia.PROVINCIA) {
    const partido = clasificacion.partido ? `${clasificacion.partido}, ` : "";
    return `${direccionUsada}, ${localidad}, ${partido}Provincia de Buenos Aires, Argentina`;
  }
  // Sin clasificación posible (API caída, dirección no reconocida): se
  // mantiene el comportamiento anterior, mejor que nada.
  return `${direccionUsada}, ${localidad}`;
}
