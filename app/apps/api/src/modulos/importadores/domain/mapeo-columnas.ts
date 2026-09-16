import { TipoServicio } from "@mym/shared-types";
import { camposObligatoriosPara, CampoCanonico, MapeoColumnas } from "./campo-canonico";
import { DICCIONARIO_SINONIMOS } from "./diccionario-sinonimos";

const MAPA_ACENTOS: Record<string, string> = {
  Á: "A",
  É: "E",
  Í: "I",
  Ó: "O",
  Ú: "U",
  Ü: "U",
  Ñ: "N",
};

// Sin acentos, mayúsculas, espacios colapsados — así "Dirección", "DIRECCION "
// y "dirección" matchean contra el mismo sinónimo del diccionario.
export function normalizarEncabezado(texto: string): string {
  return texto
    .trim()
    .toUpperCase()
    .replace(/[ÁÉÍÓÚÜÑ]/g, (letra) => MAPA_ACENTOS[letra])
    .replace(/[°º]/g, "")
    .replace(/\s+/g, " ");
}

export interface ResultadoMapeoAutomatico {
  mapeo: MapeoColumnas;
  camposObligatoriosFaltantes: CampoCanonico[];
}

// Intenta mapear los encabezados REALES de un Excel (tal cual vienen, sin tocar)
// contra los campos canónicos, usando el diccionario de sinónimos. No importa
// el cliente ni el formato: si el encabezado matchea algún sinónimo conocido,
// se mapea solo. Lo que no matchea queda en camposObligatoriosFaltantes para
// que se resuelva a mano UNA vez (ver ImportadoresService.confirmarMapeoManual).
export function intentarMapeoAutomatico(
  encabezadosReales: string[],
  tipoServicio: TipoServicio = TipoServicio.PANAL,
): ResultadoMapeoAutomatico {
  const normalizadoAOriginal = new Map(
    encabezadosReales.map((original) => [normalizarEncabezado(original), original]),
  );

  const mapeo: MapeoColumnas = {};

  for (const [campo, sinonimos] of Object.entries(DICCIONARIO_SINONIMOS) as [
    CampoCanonico,
    string[],
  ][]) {
    const sinonimoEncontrado = sinonimos.find((sinonimo) => normalizadoAOriginal.has(sinonimo));
    if (sinonimoEncontrado) {
      mapeo[campo] = normalizadoAOriginal.get(sinonimoEncontrado);
    }
  }

  const camposObligatoriosFaltantes = camposObligatoriosPara(tipoServicio).filter((campo) => !mapeo[campo]);

  return { mapeo, camposObligatoriosFaltantes };
}

// Combina el mapeo automático con las correcciones que confirmó el usuario
// a mano (mapeo-manual), para persistirlo como PerfilImportacion completo.
export function combinarMapeo(automatico: MapeoColumnas, manual: MapeoColumnas): MapeoColumnas {
  return { ...automatico, ...manual };
}
