import { CabaProvincia } from "@mym/shared-types";

// Puerto para clasificar una localidad como CABA o Provincia — DOCUMENTO
// TECNICO.md: se resuelve con la API oficial y gratuita de datos.gob.ar
// (georef-ar-api) en vez de pedirle al cliente un catálogo cargado a mano.
// Devuelve null cuando no se pudo clasificar con confianza — nunca "adivina".
// Clasifica por NOMBRE de localidad (ej. "Monserrat", "Avellaneda"), no por
// dirección completa: buscar una calle+altura es ambiguo a nivel país (ver
// georef-ar.adapter.ts), buscar el nombre de una localidad es un universo
// mucho más chico y confiable.
export interface NormalizadorDireccionesPort {
  clasificarCabaProvincia(localidad: string): Promise<CabaProvincia | null>;
}

export const NORMALIZADOR_DIRECCIONES = Symbol("NORMALIZADOR_DIRECCIONES");
