import { FilaExcelCruda } from "../../importadores/domain/lector-excel.port";
import { DatosFiscalesCombustible } from "./gasto-chofer";

// Una línea de combustible ya extraída del Excel real (hoja
// "HWCompra-modelo") — sin resolver todavía contra el cache de choferes,
// eso lo hace el service (necesita ir a buscarlos).
export interface LineaCombustible extends DatosFiscalesCombustible {
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

function aFecha(valor: unknown): Date | null {
  return valor instanceof Date ? valor : null;
}

// "Tipo Suc-Número" (ej. "A 00007-9739") es la forma habitual de referenciar
// un comprobante fiscal argentino — combinado legible para pantalla/Excel,
// además de guardar cada parte por separado (ver DatosFiscalesCombustible).
function construirComprobante(fila: FilaExcelCruda): string | null {
  const tipo = aTexto(fila["Tipo"]);
  const suc = aTexto(fila["Suc."]);
  const numero = aTexto(fila["Número"]);
  if (!suc && !numero) return tipo;
  return [tipo, [suc, numero].filter(Boolean).join("-")].filter(Boolean).join(" ");
}

// Error real detectado 2026-10-07 (reunión con Leonardo): la hoja
// "HWCompra-modelo" trae un comprobante fiscal completo (19 columnas más
// allá de fecha/monto/proveedor/chofer que se capturaban antes) — ahora se
// guardan todas, nombres y tipos tomados de las columnas reales del
// archivo (ver headers exactos abajo), no inventados.
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
      fechaRecepcion: aFecha(fila["Fecha Recepción"]),
      comprobanteCodigo: aTexto(fila["Cpbte"]),
      comprobanteTipo: aTexto(fila["Tipo"]),
      comprobanteSucursal: aTexto(fila["Suc."]),
      comprobanteNumero: aTexto(fila["Número"]),
      tipoDocumento: aTexto(fila["Tipo Doc."]),
      cuit: aTexto(fila["CUIT"]),
      domicilio: aTexto(fila["Domicilio"]),
      codigoPostal: aTexto(fila["C.P."]),
      provincia: aTexto(fila["Pcia"]),
      condicionFiscal: aTexto(fila["Cond Fisc"]),
      codigoNeto: aTexto(fila["Cód. Neto"]),
      netoGravado: aNumero(fila["Neto Gravado"]),
      alicuota: aNumero(fila["Alíc."]),
      ivaLiquidado: aNumero(fila["IVA Liquidado"]),
      ivaCredito: aNumero(fila["IVA Crédito"]),
      codigoNgEx: aTexto(fila["Cód. NG/EX"]),
      conceptosNgEx: aNumero(fila["Conceptos NG/EX"]),
      codigoPR: aTexto(fila["Cód. P/R"]),
      percepcionRetencion: aNumero(fila["Perc./Ret."]),
      provinciaPR: aTexto(fila["Pcia P/R"]),
    });
  }
  return lineas;
}
