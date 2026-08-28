import { EstadoGrupoFacturacion } from "@mym/shared-types";

export interface TarifaCliente {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
  monto: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

export interface PorcentajeSegundoServicio {
  id: string;
  clienteId: string;
  porcentaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

// Liquidación a transportistas — monto por viaje, configurable con vigencia,
// sin clienteId (decisión 2026-08-26, ver DOCUMENTO TECNICO.md historial).
export interface TarifaTransportista {
  id: string;
  monto: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

export type ReglaAplicada = "2x1" | "UNIFICADA" | "INDIVIDUAL";

export interface GrupoFacturacion {
  id: string;
  clienteId: string;
  mes: number;
  anio: number;
  estado: EstadoGrupoFacturacion;
  reglaAplicada: ReglaAplicada;
  tarifaUtilizada: number | null;
  porcentajeAplicado: number | null;
  importeCalculado: number;
  confirmadoEn: string | null;
  confirmadoPorId: string | null;
  pedidoIds: string[];
}

export interface PedidoExcluido {
  pedidoId: string;
  motivo: string;
}

// §4.2 TEMAS_PENDIENTES.md: resumen de cuántos viajes hizo cada chofer en un
// mes y cuánto se le debe pagar (tarifaPorViaje × cantidadViajes).
export interface ResumenChofer {
  choferId: string;
  choferNombre: string;
  cantidadViajes: number;
  tarifaPorViaje: number;
  totalAPagar: number;
}

export interface ResultadoVistaPrevia {
  grupos: GrupoFacturacion[];
  excluidos: PedidoExcluido[];
}
