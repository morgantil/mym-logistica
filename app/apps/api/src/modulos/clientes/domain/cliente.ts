import { FormatoRemito, TipoServicioCliente } from "@mym/shared-types";

export interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
  tipoServicio: TipoServicioCliente;
  // Decisión 2026-09-30: false = tarifa plana CABA/Provincia (ignora el
  // partido); true = factura por Cordón resolviendo el partido — ver
  // comentario en schema.prisma y ZonasTarifariasService.resolverParaPedido.
  facturaPorCordon: boolean;
  // Ver comentario en el enum FormatoRemito (schema.prisma). Null = sin
  // remito preimpreso configurado para este cliente.
  formatoRemito: FormatoRemito | null;
  // Decisión 2026-10-04: "Carga 3" (load_3) al enviar a SimpliRoute, solo
  // para pedidos de este cliente — ver comentario en schema.prisma.
  usaCarga3: boolean;
  // Reunión 2026-10-23 — texto libre fijo por cliente, mapea a
  // visit_type/notes/seller del Visit Object de SimpliRoute. Ver comentario
  // en schema.prisma.
  tipoVisitaSimpliRoute: string | null;
  notaSimpliRoute: string | null;
  sellerSimpliRoute: string | null;
  remitoHabilitado: boolean;
}
