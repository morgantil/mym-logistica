import type { CampoCanonico } from "./tipos";

// Solo texto para mostrar en la UI — la lista autoritativa de qué campos son
// obligatorios vive en el backend (campo-canonico.ts) y llega en la respuesta
// de la API (camposObligatoriosFaltantes), no se duplica acá.
export const CAMPO_CANONICO_LABELS: Record<CampoCanonico, string> = {
  numeroAfiliado: "Número de afiliado",
  destinatario: "Destinatario",
  direccion: "Dirección",
  localidad: "Localidad",
  fechaEntrega: "Fecha de entrega",
  codigoProducto: "Código de producto",
  descripcionProducto: "Descripción del producto",
  cantidad: "Cantidad",
  ticket: "Ticket",
  telefono: "Teléfono",
  receta: "Receta",
  tipoPedido: "Tipo de pedido",
  retiroDeReceta: "Retiro de receta",
  tiempoDeEntrega: "Tiempo de entrega",
  horarioEntrega: "Horario de entrega",
  envaseTexto: "Bolsa/Bulto (texto)",
  cantidadBulto: "Cantidad de bultos",
  cantidadBolsa: "Cantidad de bolsas",
};
