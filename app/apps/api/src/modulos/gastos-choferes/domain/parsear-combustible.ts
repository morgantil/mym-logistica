import { FilaExcelCruda } from "../../importadores/domain/lector-excel.port";

// Una línea de combustible ya extraída del Excel real (hoja
// "HWCompra-modelo") — sin resolver todavía contra el cache de choferes,
// eso lo hace el service (necesita ir a buscarlos).
export interface LineaCombustible {
  fecha: Date;
  monto: number;
  choferTexto: string;
  proveedor: string | null;
  comprobante: string | null;
}

function aTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

function aNumero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor === "string") {
    const numero = Number(valor.trim());
    return Number.isFinite(numero) ? numero : null;
  }
  return null;
}

// "Tipo Suc-Número" (ej. "A 00007-9739") es la forma habitual de referenciar
// un comprobante fiscal argentino — suficiente para que alguien lo ubique en
// el archivo original, no hace falta guardar el resto de los campos
// impositivos (CUIT, IVA, Cond Fisc...) que trae la hoja — esto es para
// reportar el gasto por chofer, no para repetir el libro IVA compras.
function construirComprobante(fila: FilaExcelCruda): string | null {
  const tipo = aTexto(fila["Tipo"]);
  const suc = aTexto(fila["Suc."]);
  const numero = aTexto(fila["Número"]);
  if (!suc && !numero) return tipo;
  return [tipo, [suc, numero].filter(Boolean).join("-")].filter(Boolean).join(" ");
}

// Hoja "HWCompra-modelo": una fila = una factura de combustible. Se ignoran
// filas sin fecha real o sin un Total positivo (fila de totales, fila vacía
// que igual trajo algún valor suelto) — nunca se inventa una fecha o un
// monto. Si falta el chofer, la línea igual se importa (el gasto existió)
// pero con un texto fijo que después aparece en la cola de "sin asignar".
export function parsearCombustible(filas: FilaExcelCruda[]): LineaCombustible[] {
  const lineas: LineaCombustible[] = [];
  for (const fila of filas) {
    const fecha = fila["Fecha Emisión"];
    if (!(fecha instanceof Date)) continue;
    const monto = aNumero(fila["Total"]);
    if (monto === null || monto <= 0) continue;

    lineas.push({
      fecha,
      monto,
      choferTexto: aTexto(fila["CHOFER"]) ?? "(sin chofer en el archivo)",
      proveedor: aTexto(fila["Razón Social/Denominación Proveedor"]),
      comprobante: construirComprobante(fila),
    });
  }
  return lineas;
}
