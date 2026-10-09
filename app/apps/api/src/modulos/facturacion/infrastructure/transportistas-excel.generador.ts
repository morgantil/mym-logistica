import ExcelJS from "exceljs";
import { JornadaChofer } from "../../jornadas-choferes/domain/jornada-chofer";
import { calcularHorasJornada } from "../../jornadas-choferes/domain/calcular-horas-jornada";
import { ResumenChofer } from "../domain/motor-liquidacion-transportistas";

// Pedido en reunión 2026-10-06 (Pablo Renzo): bajar a Excel la liquidación a
// transportistas que ya se ve en pantalla (antes solo existía para la
// facturación a clientes, ver reporte-mensual-excel.generador.ts) — mismo
// resumen por chofer, armado acá en vez de ser el Excel crudo de ningún
// archivo importado.
//
// Item 4.4 TEMAS_PENDIENTES.md (2026-10-09): las Jornadas (Fecha/Hora
// inicio/Hora fin/Total horas, carga manual) van en una segunda hoja — son
// un grano distinto (por chofer y día, no un agregado mensual), mismo
// criterio que la pantalla, que las muestra en una tabla aparte.
export async function generarLiquidacionTransportistasExcel(datos: {
  periodo: string;
  resumen: ResumenChofer[];
  jornadas: JornadaChofer[];
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

  const hojaJornadas = workbook.addWorksheet("Jornadas");
  hojaJornadas.columns = [
    { header: "Chofer", key: "chofer", width: 24 },
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Hora de inicio", key: "horaInicio", width: 14 },
    { header: "Hora de fin", key: "horaFin", width: 14 },
    { header: "Total de horas", key: "totalHoras", width: 14 },
  ];
  hojaJornadas.getRow(1).font = { bold: true };

  for (const jornada of datos.jornadas) {
    hojaJornadas.addRow({
      chofer: jornada.choferNombre,
      fecha: jornada.fecha.toISOString().slice(0, 10),
      horaInicio: jornada.horaInicio ?? "",
      horaFin: jornada.horaFin ?? "",
      totalHoras: calcularHorasJornada(jornada.horaInicio, jornada.horaFin) ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
