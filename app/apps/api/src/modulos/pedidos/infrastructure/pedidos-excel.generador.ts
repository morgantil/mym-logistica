import ExcelJS from "exceljs";
import {
  EstadoPedido,
  EstadoSimpliroute,
  EstadoValidacion,
  PrioridadPedido,
  TipoServicio,
} from "@mym/shared-types";
import { PedidoListado } from "../domain/pedido";

// Decisión 2026-10-04 (reunión con el cliente, Pablo Renzo): "descarga de
// pedidos a formato XLS a partir de filtros, con todos los campos
// existentes" — mismo criterio que el reporte de Facturación
// (reporte-mensual-excel.generador.ts): una sola hoja, un encabezado por
// columna, texto legible en vez del valor crudo del enum.

const TEXTO_ESTADO: Record<EstadoPedido, string> = {
  [EstadoPedido.SIN_ASIGNAR]: "Sin asignar",
  [EstadoPedido.COORDINADO]: "Coordinado",
  [EstadoPedido.EN_TRANSITO]: "En tránsito",
  [EstadoPedido.ENTREGADO]: "Entregado",
  [EstadoPedido.ENTREGA_FALLIDA]: "Entrega fallida",
  [EstadoPedido.CANCELADO]: "Cancelado",
};

const TEXTO_PRIORIDAD: Record<PrioridadPedido, string> = {
  [PrioridadPedido.NORMAL]: "Normal",
  [PrioridadPedido.FIN_DE_SEMANA]: "Fin de semana",
  [PrioridadPedido.URGENTE]: "Urgente",
  [PrioridadPedido.CRITICA]: "Crítica",
};

const TEXTO_VALIDACION: Record<EstadoValidacion, string> = {
  [EstadoValidacion.PENDIENTE]: "Pendiente",
  [EstadoValidacion.VALIDO]: "Válido",
  [EstadoValidacion.CON_ERRORES]: "Con errores",
};

const TEXTO_SIMPLIROUTE: Record<EstadoSimpliroute, string> = {
  [EstadoSimpliroute.NO_ENVIADO]: "No enviado",
  [EstadoSimpliroute.ENVIADO]: "Enviado",
  [EstadoSimpliroute.NO_ENCONTRADO]: "No encontrado",
  [EstadoSimpliroute.ERROR]: "Error",
};

const TEXTO_TIPO_SERVICIO: Record<TipoServicio, string> = {
  [TipoServicio.PANAL]: "Pañales",
  [TipoServicio.MEDICAMENTO]: "Medicamentos",
};

export async function generarPedidosExcel(pedidos: PedidoListado[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MyM Logística";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Pedidos");
  hoja.columns = [
    { header: "Nº Pedido", key: "numero", width: 10 },
    { header: "Cliente", key: "cliente", width: 24 },
    { header: "Tipo de servicio", key: "tipoServicio", width: 16 },
    { header: "Estado", key: "estado", width: 16 },
    { header: "Prioridad", key: "prioridad", width: 14 },
    { header: "Nº afiliado", key: "afiliado", width: 18 },
    { header: "Destinatario", key: "destinatario", width: 28 },
    { header: "Teléfono", key: "telefono", width: 18 },
    { header: "Dirección", key: "direccion", width: 32 },
    { header: "Localidad", key: "localidad", width: 18 },
    { header: "Zona", key: "zona", width: 16 },
    { header: "Chofer", key: "chofer", width: 20 },
    { header: "Fecha de entrega", key: "fecha", width: 14 },
    { header: "Fecha de subida", key: "fechaSubida", width: 18 },
    { header: "Bultos", key: "bultos", width: 10 },
    { header: "Cantidad de productos", key: "cantidadProductos", width: 18 },
    { header: "Cantidad de unidades", key: "cantidadUnidades", width: 18 },
    { header: "Remito", key: "remito", width: 20 },
    { header: "Receta", key: "receta", width: 16 },
    { header: "Tipo de pedido", key: "tipoPedido", width: 16 },
    { header: "Retiro de receta", key: "retiroDeReceta", width: 16 },
    { header: "Tiempo de entrega", key: "tiempoDeEntrega", width: 16 },
    { header: "Horario de entrega", key: "horarioEntrega", width: 16 },
    { header: "Validación", key: "validacion", width: 14 },
    { header: "SimpliRoute", key: "simpliroute", width: 14 },
    { header: "Observaciones", key: "observaciones", width: 28 },
    { header: "Comentarios", key: "comentario", width: 28 },
    { header: "Ruta", key: "ruta", width: 14 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const pedido of pedidos) {
    hoja.addRow({
      numero: pedido.numero,
      cliente: pedido.clienteNombre,
      tipoServicio: TEXTO_TIPO_SERVICIO[pedido.tipoServicio],
      estado: TEXTO_ESTADO[pedido.estado],
      prioridad: TEXTO_PRIORIDAD[pedido.prioridad],
      afiliado: pedido.numeroAfiliado,
      destinatario: pedido.destinatarioNombre,
      telefono: pedido.destinatarioTelefono ?? "",
      direccion: pedido.direccionUsada,
      localidad: pedido.localidad,
      zona: pedido.zonaNombre ?? "",
      chofer: pedido.choferNombre ?? "",
      fecha: pedido.fechaProgramada.toISOString().slice(0, 10),
      fechaSubida: pedido.creadoEn.toISOString().slice(0, 16).replace("T", " "),
      bultos: pedido.bultos,
      cantidadProductos: pedido.productos.length,
      cantidadUnidades: pedido.productos.reduce((total, p) => total + p.cantidad, 0),
      remito: pedido.remito ?? "",
      receta: pedido.recetaResuelta ?? pedido.receta ?? "",
      tipoPedido: pedido.tipoPedido ?? "",
      retiroDeReceta: pedido.retiroDeReceta ?? "",
      tiempoDeEntrega: pedido.tiempoDeEntrega ?? "",
      horarioEntrega: pedido.horarioEntrega ?? "",
      validacion: TEXTO_VALIDACION[pedido.estadoValidacion],
      simpliroute: TEXTO_SIMPLIROUTE[pedido.estadoSimpliroute],
      observaciones: pedido.observaciones ?? "",
      comentario: pedido.comentario ?? "",
      ruta: pedido.ruta ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
