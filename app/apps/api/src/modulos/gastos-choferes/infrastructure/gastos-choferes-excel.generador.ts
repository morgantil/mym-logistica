import ExcelJS from "exceljs";
import { TipoGastoChofer } from "@mym/shared-types";
import { GastoChofer } from "../domain/gasto-chofer";

const TEXTO_TIPO: Record<TipoGastoChofer, string> = {
  [TipoGastoChofer.COMBUSTIBLE]: "Combustible",
  [TipoGastoChofer.PEAJE]: "Peaje",
};

function aFechaOVacio(fecha: Date | null): string {
  return fecha ? fecha.toISOString().slice(0, 10) : "";
}

// §4 TEMAS_PENDIENTES.md — "bajada de reporte a excel" del combustible y
// peajes por chofer (ítem desbloqueado 2026-10-05). Detalle por gasto, igual
// criterio que pedidos-excel.generador.ts (todas las columnas, nada
// resumido) — el resumen por chofer se arma en pantalla, acá va el detalle.
// Error real corregido 2026-10-07: se agregaron las columnas del comprobante
// fiscal completo de Combustible (ver DatosFiscalesCombustible) — quedan
// vacías en las filas de Peaje, esa hoja nunca trajo esos datos.
export async function generarGastosChoferesExcel(gastos: GastoChofer[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet("Combustible y peajes");

  hoja.columns = [
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Chofer", key: "chofer", width: 20 },
    { header: "Texto original del archivo", key: "choferOriginal", width: 24 },
    { header: "Proveedor", key: "proveedor", width: 28 },
    { header: "Comprobante", key: "comprobante", width: 18 },
    { header: "Monto", key: "monto", width: 14 },
    { header: "Fecha Recepción", key: "fechaRecepcion", width: 14 },
    { header: "Cpbte", key: "comprobanteCodigo", width: 10 },
    { header: "Tipo Cpbte", key: "comprobanteTipo", width: 10 },
    { header: "Suc.", key: "comprobanteSucursal", width: 10 },
    { header: "Número", key: "comprobanteNumero", width: 12 },
    { header: "Tipo Doc.", key: "tipoDocumento", width: 10 },
    { header: "CUIT", key: "cuit", width: 16 },
    { header: "Domicilio", key: "domicilio", width: 28 },
    { header: "C.P.", key: "codigoPostal", width: 8 },
    { header: "Pcia", key: "provincia", width: 10 },
    { header: "Cond Fisc", key: "condicionFiscal", width: 10 },
    { header: "Cód. Neto", key: "codigoNeto", width: 10 },
    { header: "Neto Gravado", key: "netoGravado", width: 14 },
    { header: "Alíc.", key: "alicuota", width: 8 },
    { header: "IVA Liquidado", key: "ivaLiquidado", width: 14 },
    { header: "IVA Crédito", key: "ivaCredito", width: 14 },
    { header: "Cód. NG/EX", key: "codigoNgEx", width: 10 },
    { header: "Conceptos NG/EX", key: "conceptosNgEx", width: 16 },
    { header: "Cód. P/R", key: "codigoPR", width: 10 },
    { header: "Perc./Ret.", key: "percepcionRetencion", width: 12 },
    { header: "Pcia P/R", key: "provinciaPR", width: 10 },
    { header: "Archivo de origen", key: "archivo", width: 30 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const gasto of gastos) {
    hoja.addRow({
      fecha: gasto.fecha.toISOString().slice(0, 10),
      tipo: TEXTO_TIPO[gasto.tipo],
      chofer: gasto.choferNombre ?? "Sin asignar",
      choferOriginal: gasto.choferNombreOriginal,
      proveedor: gasto.proveedor ?? "",
      comprobante: gasto.comprobante ?? "",
      monto: gasto.monto,
      fechaRecepcion: aFechaOVacio(gasto.fechaRecepcion),
      comprobanteCodigo: gasto.comprobanteCodigo ?? "",
      comprobanteTipo: gasto.comprobanteTipo ?? "",
      comprobanteSucursal: gasto.comprobanteSucursal ?? "",
      comprobanteNumero: gasto.comprobanteNumero ?? "",
      tipoDocumento: gasto.tipoDocumento ?? "",
      cuit: gasto.cuit ?? "",
      domicilio: gasto.domicilio ?? "",
      codigoPostal: gasto.codigoPostal ?? "",
      provincia: gasto.provincia ?? "",
      condicionFiscal: gasto.condicionFiscal ?? "",
      codigoNeto: gasto.codigoNeto ?? "",
      netoGravado: gasto.netoGravado ?? "",
      alicuota: gasto.alicuota ?? "",
      ivaLiquidado: gasto.ivaLiquidado ?? "",
      ivaCredito: gasto.ivaCredito ?? "",
      codigoNgEx: gasto.codigoNgEx ?? "",
      conceptosNgEx: gasto.conceptosNgEx ?? "",
      codigoPR: gasto.codigoPR ?? "",
      percepcionRetencion: gasto.percepcionRetencion ?? "",
      provinciaPR: gasto.provinciaPR ?? "",
      archivo: gasto.archivoOrigen,
    });
  }

  const total = gastos.reduce((suma, gasto) => suma + gasto.monto, 0);
  const filaTotal = hoja.addRow({ chofer: "Total", monto: total });
  filaTotal.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
