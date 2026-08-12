import { CabaProvincia } from "@mym/shared-types";

// Tarifas CABA/Provincia por cliente, con vigencia para mantener histórico —
// DOCUMENTO FUNCIONAL.md §23.
export interface TarifaCliente {
  id: string;
  clienteId: string;
  tipo: CabaProvincia;
  monto: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}

// Porcentaje aplicado al segundo servicio en una entrega unificada, también
// con vigencia — DOCUMENTO FUNCIONAL.md §25.
export interface PorcentajeSegundoServicio {
  id: string;
  clienteId: string;
  porcentaje: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}
