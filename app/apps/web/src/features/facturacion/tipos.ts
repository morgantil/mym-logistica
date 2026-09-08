import { EstadoGrupoFacturacion, TipoEnvase, TipoServicio } from "@mym/shared-types";

export interface TarifaCliente {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
  tipoServicio: TipoServicio;
  tipoEnvase: TipoEnvase | null;
  monto: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

export interface PorcentajeSegundoServicio {
  id: string;
  clienteId: string;
  porcentajePanal: number;
  porcentajeMedicamento: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

// Guia Arbet paso 4/8: combinación habilitada de unificación ENTRE dos
// clientes distintos.
export interface CombinacionUnificacionClientes {
  id: string;
  clienteMedicamentoId: string;
  clienteMedicamentoNombre?: string;
  clientePanalId: string;
  clientePanalNombre?: string;
  activa: boolean;
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
  porcentajePanalAplicado: number | null;
  porcentajeMedicamentoAplicado: number | null;
  pedidoSocioId: string | null;
  clienteSocioId: string | null;
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
