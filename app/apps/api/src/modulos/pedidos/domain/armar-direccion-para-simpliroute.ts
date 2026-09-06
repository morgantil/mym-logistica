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
//
// Se usa `localidadOficial` (nombre bien escrito, con acentos, resuelto
// por GeorefArAdapter), no la localidad cruda del Excel — encontrado el
// mismo día: mandar la localidad tal cual vino ("Vte. Lopez") junto al
// partido ya resuelto ("Vicente López") es una mezcla rara que confundió
// más al geocodificador que ayudar (terminó en CABA en vez de Vicente
// López). El nombre oficial reemplaza abreviaturas y acentos faltantes.
export function armarDireccionParaSimpliRoute(
  direccionUsada: string,
  localidad: string,
  clasificacion: ClasificacionLocalidad | null,
): string {
  if (clasificacion?.clasificacion === CabaProvincia.CABA) {
    // El sinónimo directo de la ciudad entera ("CABA", "Capital Federal")
    // ya resuelve `localidadOficial` como "CABA" — no repetirlo dos veces.
    if (clasificacion.localidadOficial.toUpperCase() === "CABA") {
      return `${direccionUsada}, CABA, Argentina`;
    }
    return `${direccionUsada}, ${clasificacion.localidadOficial}, CABA, Argentina`;
  }
  if (clasificacion?.clasificacion === CabaProvincia.PROVINCIA) {
    // Localidad y partido a veces se llaman igual (ej. "Vicente López") —
    // no repetirlo dos veces seguidas.
    const partido =
      clasificacion.partido && clasificacion.partido !== clasificacion.localidadOficial
        ? `${clasificacion.partido}, `
        : "";
    return `${direccionUsada}, ${clasificacion.localidadOficial}, ${partido}Provincia de Buenos Aires, Argentina`;
  }
  // Sin clasificación posible (API caída, dirección no reconocida): se
  // mantiene el comportamiento anterior, mejor que nada.
  return `${direccionUsada}, ${localidad}`;
}
