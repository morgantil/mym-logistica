import { CabaProvincia } from "@mym/shared-types";

// Puerto para clasificar una dirección como CABA o Provincia — DOCUMENTO
// TECNICO.md: se resuelve con la API oficial y gratuita de datos.gob.ar
// (georef-ar-api) en vez de pedirle al cliente un catálogo cargado a mano.
// Devuelve null cuando no se pudo clasificar con confianza — nunca "adivina".
export interface NormalizadorDireccionesPort {
  clasificarCabaProvincia(direccion: string, localidad: string): Promise<CabaProvincia | null>;
}

export const NORMALIZADOR_DIRECCIONES = Symbol("NORMALIZADOR_DIRECCIONES");
