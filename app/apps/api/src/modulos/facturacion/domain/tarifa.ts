// Tarifas por cliente y zona tarifaria (CABA/Cordón 1/2/3, configurable —
// ver ZonaTarifaria), con vigencia para mantener histórico. DOCUMENTO
// FUNCIONAL.md §23, actualizado por el documento v6 §10.2 (zonas por cordón).
export interface TarifaCliente {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
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

// Liquidación a transportistas — monto fijo por viaje, configurable con
// vigencia (decisión 2026-08-26, ver DOCUMENTO TECNICO.md historial). Sin
// clienteId: es un valor único, no depende del cliente.
export interface TarifaTransportista {
  id: string;
  monto: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}
