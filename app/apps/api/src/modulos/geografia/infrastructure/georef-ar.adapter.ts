import { Injectable, Logger } from "@nestjs/common";
import { CabaProvincia } from "@mym/shared-types";
import { ClasificacionLocalidad, NormalizadorDireccionesPort } from "../domain/normalizador-direcciones.port";

const BASE_URL = "https://apis.datos.gob.ar/georef/api";

// Nombres oficiales tal cual los devuelve georef-ar-api — no adivinar variantes.
const NOMBRE_A_ENUM: Record<string, CabaProvincia> = {
  "Ciudad Autónoma de Buenos Aires": CabaProvincia.CABA,
  "Buenos Aires": CabaProvincia.PROVINCIA,
};

interface RespuestaLocalidades {
  cantidad: number;
  localidades: { nombre: string; provincia: { nombre: string }; departamento: { nombre: string } }[];
}

// Sin acentos ni mayúsculas para comparar — encontrado 2026-09-06: el
// Excel traía "Villa Pueyrredon" (sin acento) contra el nombre oficial
// "Villa Pueyrredón" (con acento), la comparación exacta anterior fallaba
// en silencio y la clasificación se perdía. Escribir sin tildes es muy
// común en datos reales de negocio, no es un caso raro a ignorar.
const RANGO_DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizarParaComparar(texto: string): string {
  return texto.trim().toLowerCase().normalize("NFD").replace(RANGO_DIACRITICOS, "");
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
  async clasificarCabaProvincia(localidad: string): Promise<ClasificacionLocalidad | null> {
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
      const normalizado = normalizarParaComparar(localidad);
      const coincidenciasEnNuestraArea = datos.localidades.filter(
        (l) =>
          normalizarParaComparar(l.nombre) === normalizado && NOMBRE_A_ENUM[l.provincia.nombre] !== undefined,
      );

      const clasificaciones = new Set(coincidenciasEnNuestraArea.map((l) => NOMBRE_A_ENUM[l.provincia.nombre]));

      if (clasificaciones.size !== 1) {
        if (clasificaciones.size > 1) {
          this.logger.warn(
            `La localidad "${localidad}" es ambigua: existe tanto en CABA como en Buenos Aires — se descarta por baja confianza.`,
          );
        }
        return null;
      }

      const clasificacion = [...clasificaciones][0];

      // El partido (ej. "Tres de Febrero", "Vicente López") solo importa
      // para Provincia — dentro del conurbano hay calles que se repiten
      // entre partidos, y a veces coinciden con el nombre de otro partido
      // (ej. "Av. San Martín" existe en Caseros Y en Munro — comprobado
      // 2026-09-06 con la misma coordenada devuelta para las dos direcciones
      // reales). Mismo criterio defensivo: solo se usa si todas las
      // coincidencias en nuestra área comparten el mismo partido.
      let partido: string | null = null;
      if (clasificacion === CabaProvincia.PROVINCIA) {
        const partidos = new Set(coincidenciasEnNuestraArea.map((l) => l.departamento.nombre));
        partido = partidos.size === 1 ? [...partidos][0] : null;
      }

      return { clasificacion, partido };
    } catch (error) {
      this.logger.warn(
        `No se pudo clasificar CABA/Provincia para la localidad "${localidad}": ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }
}
