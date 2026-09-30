import type { TipoServicioCliente } from "@mym/shared-types";

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
}
