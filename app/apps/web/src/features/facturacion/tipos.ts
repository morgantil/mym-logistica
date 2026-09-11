import { EstadoGrupoFacturacion, TipoEnvase, TipoServicio } from "@mym/shared-types";

export interface TarifaCliente {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
  tipoServicio: TipoServicio;
  tipoEnvase: TipoEnvase | null;
  monto: number;
  activa: boolean;
}

export interface PorcentajeSegundoServicio {
  id: string;
  clienteId: string;
  porcentajePanal: number;
  porcentajeMedicamento: number;
  activa: boolean;
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
  activa: boolean;
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
  cantidadViajes: number;
  importeCalculado: number;
  confirmadoEn: string | null;
  confirmadoPorId: string | null;
  pedidoIds: string[];
}

export interface PedidoExcluido {
  pedidoId: string;
  motivo: string;
}

// Detalle por pedido para la pantalla de Liquidación (§31 funcional, mismo
// dato que ya arma el Excel) — decisión 2026-09-11.
export interface PedidoFacturado {
  pedidoId: string;
  numero: number;
  fechaProgramada: string;
  destinatarioNombre: string;
  numeroAfiliado: string;
  direccion: string;
  zonaTarifariaNombre: string | null;
  tipoServicio: TipoServicio;
  choferNombre: string | null;
  grupoId: string;
  reglaAplicada: ReglaAplicada;
  tarifaUtilizada: number | null;
  porcentajeAplicado: number | null;
  porcentajePanalAplicado: number | null;
  porcentajeMedicamentoAplicado: number | null;
  cantidadViajes: number;
  importeViaje: number;
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
