import { CabaProvincia } from "@mym/shared-types";

// Resultado de clasificar una localidad — `partido` (ej. "Tres de Febrero",
// "Vicente López") solo aplica a Provincia: dentro del conurbano hay
// muchos municipios con calles homónimas entre sí (y a veces homónimas al
// propio nombre del partido, ej. "Av. San Martín" existe en Caseros Y en
// Munro, y el partido "San Martín" es otro lugar más) — agregar el partido
// ayuda a que SimpliRoute desambigüe. CABA no lo necesita: sus barrios no
// se repiten entre sí.
export interface ClasificacionLocalidad {
  clasificacion: CabaProvincia;
  // Nombre oficial tal cual lo devuelve la API — reemplaza cualquier
  // abreviatura/variante sin acento que haya venido en el Excel (ej. "Vte.
  // Lopez" → "Vicente López") al armar la dirección para SimpliRoute.
  // Encontrado 2026-09-06: mandar la localidad cruda mezclada con el
  // partido resuelto ("Vte. Lopez, Vicente López") confundía al
  // geocodificador más que ayudar.
  localidadOficial: string;
  partido: string | null;
}

// Puerto para clasificar una localidad como CABA o Provincia — DOCUMENTO
// TECNICO.md: se resuelve con la API oficial y gratuita de datos.gob.ar
// (georef-ar-api) en vez de pedirle al cliente un catálogo cargado a mano.
// Devuelve null cuando no se pudo clasificar con confianza — nunca "adivina".
// Clasifica por NOMBRE de localidad (ej. "Monserrat", "Avellaneda"), no por
// dirección completa: buscar una calle+altura es ambiguo a nivel país (ver
// georef-ar.adapter.ts), buscar el nombre de una localidad es un universo
// mucho más chico y confiable.
export interface NormalizadorDireccionesPort {
  clasificarCabaProvincia(localidad: string): Promise<ClasificacionLocalidad | null>;
}

export const NORMALIZADOR_DIRECCIONES = Symbol("NORMALIZADOR_DIRECCIONES");
