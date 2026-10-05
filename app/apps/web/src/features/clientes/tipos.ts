import type { FormatoRemito, TipoServicioCliente } from "@mym/shared-types";

export interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
  tipoServicio: TipoServicioCliente;
  // Decisión 2026-09-30: false = tarifa plana CABA/Provincia (Biosíntesis,
  // Bella Vista PAÑALES); true = factura por Cordón resolviendo el partido
  // (Bella Vista Medicamentos) — ver ZonasTarifariasService.resolverParaPedido
  // en el backend.
  facturaPorCordon: boolean;
  // Null = sin remito preimpreso configurado (no se puede imprimir).
  formatoRemito: FormatoRemito | null;
  // Decisión 2026-10-04: "Carga 3" al enviar a SimpliRoute, solo para
  // pedidos de este cliente (ej. SACEIP SOLIS) — ver PedidosService.
  usaCarga3: boolean;
}
