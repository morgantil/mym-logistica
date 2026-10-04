import { PrioridadPedido } from "@mym/shared-types";
import { CampoCanonico } from "./campo-canonico";
import { normalizarEncabezado } from "./mapeo-columnas";

export type TipoCoincidenciaRegla = "IGUAL" | "EMPIEZA_CON" | "CONTIENE";
export type AccionRegla = "ASIGNAR_VALOR" | "QUITAR_PREFIJO";

// Campos que una regla puede modificar. Es una lista cerrada a propósito
// (decisión 2026-09-24): lo que se puede definir desde la pantalla es CUÁNDO
// se aplica una regla y con qué valor, pero no qué partes del pedido puede
// tocar — eso mueve plata/etiquetas y tiene que seguir bajo control del código.
export const CAMPOS_DESTINO_REGLA = ["retiroDeReceta", "prioridad", "numeroAfiliado"] as const;
export type CampoDestinoRegla = (typeof CAMPOS_DESTINO_REGLA)[number];

// Regla de importación editable por el usuario, por cliente y tipo de
// servicio — ver ReglaImportacion en schema.prisma.
export interface ReglaImportacion {
  id: string;
  clienteId: string;
  campoOrigen: CampoCanonico;
  tipoCoincidencia: TipoCoincidenciaRegla;
  valor: string;
  accion: AccionRegla;
  campoDestino: CampoDestinoRegla;
  valorDestino: string;
  orden: number;
  activa: boolean;
}

export interface ResultadoReglas {
  numeroAfiliado?: string;
  retiroDeReceta?: string;
  prioridad?: PrioridadPedido;
}

export function coincideTexto(
  texto: string | null,
  tipo: TipoCoincidenciaRegla,
  valorRegla: string,
): boolean {
  if (texto === null) return false;
  const textoNormalizado = normalizarEncabezado(texto);
  const valorNormalizado = normalizarEncabezado(valorRegla);
  if (valorNormalizado === "") return false;
  switch (tipo) {
    case "IGUAL":
      return textoNormalizado === valorNormalizado;
    case "EMPIEZA_CON":
      return textoNormalizado.startsWith(valorNormalizado);
    case "CONTIENE":
      return textoNormalizado.includes(valorNormalizado);
  }
}

// Decisión 2026-10-04: orden de severidad para "cuál gana si varias reglas
// aplican" — Fin de semana pide más atención que Normal pero no tanta como
// Urgente/Crítica. Mismo mapa que pedido.ts (agrupación por línea de Excel).
const SEVERIDAD: Record<PrioridadPedido, number> = {
  [PrioridadPedido.NORMAL]: 0,
  [PrioridadPedido.FIN_DE_SEMANA]: 1,
  [PrioridadPedido.URGENTE]: 2,
  [PrioridadPedido.CRITICA]: 3,
};

export function esPrioridadValida(valor: string): valor is PrioridadPedido {
  return Object.prototype.hasOwnProperty.call(SEVERIDAD, valor);
}

export function prioridadMasAlta(a: PrioridadPedido, b: PrioridadPedido): PrioridadPedido {
  return SEVERIDAD[b] > SEVERIDAD[a] ? b : a;
}

// Evalúa las reglas de un cliente contra UNA fila del Excel. `leerCampo`
// devuelve el valor crudo del campo canónico (ya mapeado a la columna real) —
// las condiciones siempre se comparan contra lo que trae el archivo, no contra
// lo que otra regla ya cambió, así el orden de las reglas no altera qué
// condición se cumple. Si varias reglas de prioridad aplican, gana la más alta;
// para el resto (retiro de receta, afiliado) gana la primera según `orden`.
export function aplicarReglasImportacion(
  reglas: ReglaImportacion[],
  leerCampo: (campo: CampoCanonico) => string | null,
): ResultadoReglas {
  const resultado: ResultadoReglas = {};
  const ordenadas = reglas.filter((regla) => regla.activa).sort((a, b) => a.orden - b.orden);

  for (const regla of ordenadas) {
    const texto = leerCampo(regla.campoOrigen);
    if (!coincideTexto(texto, regla.tipoCoincidencia, regla.valor)) continue;

    if (regla.accion === "QUITAR_PREFIJO") {
      if (regla.campoDestino !== "numeroAfiliado") continue;
      const actual = resultado.numeroAfiliado ?? leerCampo("numeroAfiliado");
      const prefijo = normalizarEncabezado(regla.valor);
      if (actual !== null && normalizarEncabezado(actual).startsWith(prefijo)) {
        resultado.numeroAfiliado = actual.trim().slice(regla.valor.trim().length).trim();
      }
      continue;
    }

    if (regla.campoDestino === "prioridad") {
      if (!esPrioridadValida(regla.valorDestino)) continue;
      resultado.prioridad = resultado.prioridad
        ? prioridadMasAlta(resultado.prioridad, regla.valorDestino)
        : regla.valorDestino;
    } else if (regla.campoDestino === "retiroDeReceta") {
      if (resultado.retiroDeReceta === undefined) resultado.retiroDeReceta = regla.valorDestino;
    }
  }

  return resultado;
}
