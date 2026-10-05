import ExcelJS from "exceljs";
import { TipoGastoChofer } from "@mym/shared-types";
import { GastoChofer } from "../domain/gasto-chofer";

const TEXTO_TIPO: Record<TipoGastoChofer, string> = {
  [TipoGastoChofer.COMBUSTIBLE]: "Combustible",
  [TipoGastoChofer.PEAJE]: "Peaje",
};

// §4 TEMAS_PENDIENTES.md — "bajada de reporte a excel" del combustible y
// peajes por chofer (ítem desbloqueado 2026-10-05). Detalle por gasto, igual
// criterio que pedidos-excel.generador.ts (todas las columnas, nada
// resumido) — el resumen por chofer se arma en pantalla, acá va el detalle.
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
      archivo: gasto.archivoOrigen,
    });
  }

  const total = gastos.reduce((suma, gasto) => suma + gasto.monto, 0);
  const filaTotal = hoja.addRow({ chofer: "Total", monto: total });
  filaTotal.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
