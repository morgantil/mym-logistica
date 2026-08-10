import { Injectable, Logger } from "@nestjs/common";
import { CabaProvincia } from "@mym/shared-types";
import { NormalizadorDireccionesPort } from "../domain/normalizador-direcciones.port";

const BASE_URL = "https://apis.datos.gob.ar/georef/api";

// Nombres oficiales tal cual los devuelve georef-ar-api — no adivinar variantes.
const NOMBRE_A_ENUM: Record<string, CabaProvincia> = {
  "Ciudad Autónoma de Buenos Aires": CabaProvincia.CABA,
  "Buenos Aires": CabaProvincia.PROVINCIA,
};

interface RespuestaDirecciones {
  cantidad: number;
  direcciones: { provincia: { nombre: string } }[];
}

@Injectable()
export class GeorefArAdapter implements NormalizadorDireccionesPort {
  private readonly logger = new Logger(GeorefArAdapter.name);

  // Busca por calle+altura contra la API oficial de datos.gob.ar. OJO: una
  // calle+altura sola puede ser ambigua a nivel país (ej. "Rivadavia 100"
  // existe en 341 lugares de Argentina — lo comprobamos a mano antes de
  // programar esto). Por eso NO se confía en cualquier resultado: solo se
  // acepta si la provincia devuelta es CABA o Buenos Aires, que es donde
  // opera MyM. Si el resultado cae fuera de esa región, es señal de un
  // match ambiguo/equivocado y se devuelve null en vez de un dato falso.
  async clasificarCabaProvincia(direccion: string, localidad: string): Promise<CabaProvincia | null> {
    try {
      const url = new URL(`${BASE_URL}/direcciones`);
      url.searchParams.set("direccion", direccion);
      url.searchParams.set("max", "1");

      const respuesta = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!respuesta.ok) {
        this.logger.warn(`georef-ar-api respondió ${respuesta.status} para "${direccion}, ${localidad}".`);
        return null;
      }

      const datos = (await respuesta.json()) as RespuestaDirecciones;
      if (datos.cantidad === 0) {
        return null;
      }

      const nombreProvincia = datos.direcciones[0].provincia.nombre;
      const clasificacion = NOMBRE_A_ENUM[nombreProvincia];

      if (!clasificacion) {
        this.logger.warn(
          `"${direccion}, ${localidad}" resolvió a provincia "${nombreProvincia}", fuera del área de operación esperada (CABA/Buenos Aires) — se descarta el match por baja confianza.`,
        );
        return null;
      }

      return clasificacion;
    } catch (error) {
      this.logger.warn(
        `No se pudo clasificar CABA/Provincia para "${direccion}, ${localidad}": ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }
}
