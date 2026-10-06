import ExcelJS from "exceljs";
import { ResumenChofer } from "../domain/motor-liquidacion-transportistas";

// Pedido en reunión 2026-10-06 (Pablo Renzo): bajar a Excel la liquidación a
// transportistas que ya se ve en pantalla (antes solo existía para la
// facturación a clientes, ver reporte-mensual-excel.generador.ts) — mismo
// resumen por chofer, armado acá en vez de ser el Excel crudo de ningún
// archivo importado.
export async function generarLiquidacionTransportistasExcel(datos: {
  periodo: string;
  resumen: ResumenChofer[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MyM Logística";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Liquidación transportistas");
  hoja.columns = [
    { header: "Chofer", key: "chofer", width: 24 },
    { header: "Viajes CABA", key: "viajesCaba", width: 14 },
    { header: "Viajes Provincia", key: "viajesProvincia", width: 16 },
    { header: "Total a pagar", key: "totalAPagar", width: 16 },
  ];
  hoja.getRow(1).font = { bold: true };
  hoja.getCell("A1").note = datos.periodo;

  for (const fila of datos.resumen) {
    hoja.addRow({
      chofer: fila.choferNombre,
      viajesCaba: fila.viajesCaba,
      viajesProvincia: fila.viajesProvincia,
      totalAPagar: fila.totalAPagar,
    });
  }

  const filaTotal = hoja.addRow({
    chofer: "Total",
    viajesCaba: datos.resumen.reduce((suma, r) => suma + r.viajesCaba, 0),
    viajesProvincia: datos.resumen.reduce((suma, r) => suma + r.viajesProvincia, 0),
    totalAPagar: datos.resumen.reduce((suma, r) => suma + r.totalAPagar, 0),
  });
  filaTotal.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
