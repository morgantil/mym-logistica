import { FilaExcelCruda } from "../../importadores/domain/lector-excel.port";
import { normalizarNombreChofer } from "./normalizar-nombre-chofer";

export interface LineaPeaje {
  monto: number;
  choferTexto: string;
}

// Textos de la propia plantilla que NO son un chofer real — aparecen en la
// columna A por cómo arma el título la hoja "PEAJES" (ej. "PEAJES" solo, fila
// 1 del archivo real de septiembre 2026: A1="PEAJES ", B1="SEPTIRMBRE ",
// C1=2026 — si no se filtrara, "PEAJES" terminaría como un chofer más).
const TEXTOS_NO_CHOFER = new Set(["PEAJES"]);

function aNumero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor === "string") {
    const numero = Number(valor.trim());
    return Number.isFinite(numero) ? numero : null;
  }
  return null;
}

// Hoja "PEAJES": SIN fila de encabezado real — es un título (fila 1: nombre
// de la hoja + mes + año) seguido de filas sueltas chofer (columna A) +
// monto (columna C), sin fecha por fila (el mes/año lo informa quien
// importa, aplica a todas las líneas de esta hoja — ver
// GastosChoferesService.importar). Se lee con `sinEncabezado: true`
// (LectorExcelPort), por eso las claves acá son letras de columna.
export function parsearPeajes(filas: FilaExcelCruda[]): LineaPeaje[] {
  const lineas: LineaPeaje[] = [];
  for (const fila of filas) {
    const choferCrudo = fila["A"];
    const choferTexto = typeof choferCrudo === "string" ? choferCrudo : "";
    const normalizado = normalizarNombreChofer(choferTexto);
    if (!normalizado || TEXTOS_NO_CHOFER.has(normalizado)) continue;

    const monto = aNumero(fila["C"]);
    if (monto === null || monto <= 0) continue;

    lineas.push({ monto, choferTexto });
  }
  return lineas;
}
