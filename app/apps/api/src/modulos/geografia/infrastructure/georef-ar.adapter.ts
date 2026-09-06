import { Injectable, Logger } from "@nestjs/common";
import { CabaProvincia } from "@mym/shared-types";
import { NormalizadorDireccionesPort } from "../domain/normalizador-direcciones.port";

const BASE_URL = "https://apis.datos.gob.ar/georef/api";

// Nombres oficiales tal cual los devuelve georef-ar-api — no adivinar variantes.
const NOMBRE_A_ENUM: Record<string, CabaProvincia> = {
  "Ciudad Autónoma de Buenos Aires": CabaProvincia.CABA,
  "Buenos Aires": CabaProvincia.PROVINCIA,
};

interface RespuestaLocalidades {
  cantidad: number;
  localidades: { nombre: string; provincia: { nombre: string } }[];
}

@Injectable()
export class GeorefArAdapter implements NormalizadorDireccionesPort {
  private readonly logger = new Logger(GeorefArAdapter.name);

  // Busca por NOMBRE de localidad contra la API oficial de datos.gob.ar.
  // Se cambió de buscar por dirección completa (calle+altura) a buscar por
  // localidad el 2026-09-04: una calle+altura sola puede ser ambigua a
  // nivel país (ej. "Rivadavia 100" existe en 341 lugares de Argentina,
  // "Balcarce 594" resuelve a Rosario en vez de CABA) — comprobado a mano
  // más de una vez. El nombre de una localidad ("Monserrat", "Avellaneda")
  // es un universo mucho más chico y confiable.
  //
  // `nombre=` en este endpoint hace matching parcial (buscar "Avellaneda"
  // también trae "Parque Avellaneda"), así que se filtra a coincidencias
  // exactas de nombre antes de clasificar. Solo se acepta si TODAS las
  // coincidencias exactas caen en la misma clasificación (CABA o Buenos
  // Aires) — si hay cero, o si hay más de una distinta (ambigüedad real,
  // ej. una localidad homónima en otra provincia), se devuelve null en vez
  // de un dato falso.
  async clasificarCabaProvincia(localidad: string): Promise<CabaProvincia | null> {
    try {
      const url = new URL(`${BASE_URL}/localidades`);
      url.searchParams.set("nombre", localidad);
      url.searchParams.set("max", "15");

      const respuesta = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!respuesta.ok) {
        this.logger.warn(`georef-ar-api respondió ${respuesta.status} para la localidad "${localidad}".`);
        return null;
      }

      const datos = (await respuesta.json()) as RespuestaLocalidades;
      const normalizado = localidad.trim().toLowerCase();
      const coincidenciasExactas = datos.localidades.filter((l) => l.nombre.trim().toLowerCase() === normalizado);

      const clasificaciones = new Set(
        coincidenciasExactas
          .map((l) => NOMBRE_A_ENUM[l.provincia.nombre])
          .filter((clasificacion): clasificacion is CabaProvincia => clasificacion !== undefined),
      );

      if (clasificaciones.size !== 1) {
        if (clasificaciones.size > 1) {
          this.logger.warn(
            `La localidad "${localidad}" es ambigua: existe tanto en CABA como en Buenos Aires — se descarta por baja confianza.`,
          );
        }
        return null;
      }

      return [...clasificaciones][0];
    } catch (error) {
      this.logger.warn(
        `No se pudo clasificar CABA/Provincia para la localidad "${localidad}": ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }
}
