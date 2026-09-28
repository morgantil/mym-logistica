import ExcelJS from "exceljs";
import { TipoServicio } from "@mym/shared-types";
import { GrupoFacturacion, PedidoFacturado } from "../domain/grupo-facturacion";
import { NOMBRES_MES } from "./nombres-mes";

const TEXTO_TIPO_SERVICIO: Record<TipoServicio, string> = {
  [TipoServicio.PANAL]: "Pañales",
  [TipoServicio.MEDICAMENTO]: "Medicamentos",
};

const TEXTO_REGLA: Record<string, string> = {
  "2x1": "2×1",
  UNIFICADA: "Unificada",
  INDIVIDUAL: "Individual",
};

const TEXTO_ESTADO: Record<string, string> = {
  BORRADOR: "Borrador",
  CONFIRMADO: "Confirmado",
};

// Mismo color por regla que en la pantalla de Liquidación (ver TONO_REGLA en
// liquidacion-tab.tsx) — decisión 2026-09-27, para que se note al mismo
// golpe de vista que primero se factura lo unificado, después el 2×1 y
// después lo individual.
const COLOR_REGLA: Record<string, string> = {
  UNIFICADA: "FFD1FAE5", // verde
  "2x1": "FFFEF3C7", // ámbar
  INDIVIDUAL: "FFE5E7EB", // gris
};

// §31 funcional: "Reporte mensual", por mes y cliente, exportable a Excel.
// Dos hojas en vez de una sola tabla: un viaje (2×1/unificada) agrupa hasta 2
// pedidos y el documento funcional no define una regla para repartir el
// importe entre ellos, así que no se inventa una — la hoja de detalle
// muestra la trazabilidad completa por pedido (§32) sin fabricar un importe
// individual, y la de resumen tiene el número real que se factura por viaje.
export async function generarReporteMensualExcel(datos: {
  clienteNombre: string;
  mes: number;
  anio: number;
  pedidos: PedidoFacturado[];
  grupos: GrupoFacturacion[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MyM Logística";
  workbook.created = new Date();

  const periodo = `${NOMBRES_MES[datos.mes - 1]} ${datos.anio}`;

  const hojaDetalle = workbook.addWorksheet("Detalle por pedido");
  hojaDetalle.columns = [
    { header: "Cliente", key: "cliente", width: 24 },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Destinatario", key: "destinatario", width: 28 },
    { header: "Número de afiliado", key: "afiliado", width: 18 },
    { header: "Dirección", key: "direccion", width: 32 },
    { header: "Zona tarifaria", key: "zonaTarifaria", width: 14 },
    { header: "Tipo de servicio", key: "tipoServicio", width: 16 },
    { header: "Chofer", key: "chofer", width: 20 },
    { header: "Regla aplicada", key: "regla", width: 14 },
    { header: "Unificación", key: "unificacion", width: 22 },
    { header: "Cantidad de viajes", key: "cantidadViajes", width: 16 },
    { header: "Tarifa del viaje", key: "tarifa", width: 16 },
    { header: "Porcentaje aplicado", key: "porcentaje", width: 18 },
    { header: "% Pañal (unificada)", key: "porcentajePanal", width: 18 },
    { header: "Monto fijo Medicamento (unificada)", key: "montoFijoMedicamento", width: 26 },
    { header: "Importe del viaje", key: "importe", width: 16 },
  ];
  hojaDetalle.getRow(1).font = { bold: true };

  // Mismo orden que los grupos (unificadas primero, después 2×1, después
  // individuales): el detalle por pedido sigue el orden de la liquidación.
  const posicionGrupo = new Map(datos.grupos.map((grupo, indice) => [grupo.id, indice]));
  const nombreUnificacionPorGrupo = new Map(datos.grupos.map((grupo) => [grupo.id, grupo.nombreUnificacion ?? ""]));
  const pedidosOrdenados = [...datos.pedidos].sort(
    (a, b) => (posicionGrupo.get(a.grupoId) ?? 0) - (posicionGrupo.get(b.grupoId) ?? 0),
  );

  for (const pedido of pedidosOrdenados) {
    hojaDetalle.addRow({
      cliente: datos.clienteNombre,
      fecha: pedido.fechaProgramada.toISOString().slice(0, 10),
      destinatario: pedido.destinatarioNombre,
      afiliado: pedido.numeroAfiliado,
      direccion: pedido.direccion,
      zonaTarifaria: pedido.zonaTarifariaNombre ?? "Sin clasificar",
      tipoServicio: TEXTO_TIPO_SERVICIO[pedido.tipoServicio],
      chofer: pedido.choferNombre ?? "Sin asignar",
      regla: TEXTO_REGLA[pedido.reglaAplicada] ?? pedido.reglaAplicada,
      unificacion: nombreUnificacionPorGrupo.get(pedido.grupoId) ?? "",
      cantidadViajes: pedido.cantidadViajes,
      tarifa: pedido.tarifaUtilizada,
      porcentaje: pedido.porcentajeAplicado,
      porcentajePanal: pedido.porcentajePanalAplicado,
      montoFijoMedicamento: pedido.montoFijoMedicamentoAplicado,
      importe: pedido.importeViaje,
    });
  }

  // Un viaje puede tener hasta 2 pedidos con la misma fecha/dirección (por
  // construcción del motor de reglas) — se toma cualquiera de sus pedidos
  // para mostrar fecha/dirección en el resumen, da lo mismo cuál.
  const fechaYDireccionPorGrupo = new Map(
    datos.pedidos.map((pedido) => [pedido.grupoId, { fecha: pedido.fechaProgramada, direccion: pedido.direccion }]),
  );

  const hojaResumen = workbook.addWorksheet("Resumen por viaje");
  hojaResumen.columns = [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Dirección", key: "direccion", width: 32 },
    { header: "Regla aplicada", key: "regla", width: 14 },
    { header: "Unificación", key: "unificacion", width: 22 },
    { header: "Cantidad de pedidos", key: "cantidadPedidos", width: 18 },
    { header: "Cantidad de viajes", key: "cantidadViajes", width: 16 },
    { header: "Tarifa", key: "tarifa", width: 14 },
    { header: "Porcentaje", key: "porcentaje", width: 14 },
    { header: "Importe", key: "importe", width: 14 },
    { header: "Estado", key: "estado", width: 14 },
  ];
  hojaResumen.getRow(1).font = { bold: true };

  // Una fila separadora con el nombre del bloque cada vez que cambia la
  // regla — los grupos ya vienen ordenados UNIFICADA → 2×1 → INDIVIDUAL
  // (backend), acá solo se marca el corte, igual que en la pantalla.
  let reglaAnterior: string | null = null;
  for (const grupo of datos.grupos) {
    if (grupo.reglaAplicada !== reglaAnterior) {
      reglaAnterior = grupo.reglaAplicada;
      const filaSeparadora = hojaResumen.addRow({
        fecha: `Facturando ${TEXTO_REGLA[grupo.reglaAplicada] ?? grupo.reglaAplicada}`,
      });
      filaSeparadora.font = { bold: true };
      filaSeparadora.eachCell({ includeEmpty: true }, (celda) => {
        celda.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLOR_REGLA[grupo.reglaAplicada] ?? "FFE5E7EB" },
        };
      });
    }

    const referencia = fechaYDireccionPorGrupo.get(grupo.id);
    hojaResumen.addRow({
      fecha: referencia?.fecha.toISOString().slice(0, 10) ?? "",
      direccion: referencia?.direccion ?? "",
      regla: TEXTO_REGLA[grupo.reglaAplicada] ?? grupo.reglaAplicada,
      unificacion: grupo.nombreUnificacion ?? "",
      cantidadPedidos: grupo.pedidoIds.length,
      cantidadViajes: grupo.cantidadViajes,
      tarifa: grupo.tarifaUtilizada,
      porcentaje: grupo.porcentajeAplicado,
      importe: grupo.importeCalculado,
      estado: TEXTO_ESTADO[grupo.estado] ?? grupo.estado,
    });
  }

  const filaTotal = hojaResumen.addRow({
    regla: "Total",
    cantidadPedidos: datos.grupos.reduce((total, g) => total + g.pedidoIds.length, 0),
    cantidadViajes: datos.grupos.reduce((total, g) => total + g.cantidadViajes, 0),
    importe: datos.grupos.reduce((total, g) => total + g.importeCalculado, 0),
  });
  filaTotal.font = { bold: true };

  hojaResumen.getCell("A1").note = `${datos.clienteNombre} — ${periodo}`;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
