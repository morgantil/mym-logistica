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
}
