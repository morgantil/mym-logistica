import { CabaProvincia, EstadoGrupoFacturacion, PrioridadPedido, TipoEnvase, TipoServicio } from "@mym/shared-types";

export interface TarifaCliente {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
  tipoServicio: TipoServicio;
  tipoEnvase: TipoEnvase | null;
  // Decisión 2026-10-04: la Prioridad del pedido también puede cambiar la
  // tarifa (ej. Urgente o Fin de semana más caro que Normal).
  prioridad: PrioridadPedido;
  monto: number;
  activa: boolean;
}

export interface PorcentajeSegundoServicio {
  id: string;
  clienteId: string;
  porcentajePanal: number;
  activa: boolean;
}

// Monto fijo del lado medicamento en una entrega unificada — decisión
// 2026-09-12 (reemplaza al % que usaba antes, ver DOCUMENTO TECNICO.md
// historial). `tipoEnvase` null = aplica igual a Bolsa y Bulto.
export interface MontoUnificadoMedicamento {
  id: string;
  clienteId: string;
  zonaTarifariaId: string;
  zonaTarifariaNombre?: string;
  tipoEnvase: TipoEnvase | null;
  // Ver comentario en TarifaCliente.prioridad — mismo criterio acá.
  prioridad: PrioridadPedido;
  monto: number;
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
  nombre: string | null;
  activa: boolean;
}

// Liquidación a transportistas — monto por viaje, configurable con vigencia,
// sin clienteId (decisión 2026-08-26, ver DOCUMENTO TECNICO.md historial).
// Desde el 2026-10-04 distingue zona (CABA paga distinto que Provincia).
export interface TarifaTransportista {
  id: string;
  zona: CabaProvincia;
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
  montoFijoMedicamentoAplicado: number | null;
  pedidoSocioId: string | null;
  clienteSocioId: string | null;
  cantidadViajes: number;
  importeCalculado: number;
  confirmadoEn: string | null;
  confirmadoPorId: string | null;
  pedidoIds: string[];
  // Nombre de la combinación que originó una UNIFICADA entre clientes.
  nombreUnificacion?: string | null;
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
  // Decisión 2026-10-04: comentario que haya cargado el operador en Pedidos.
  comentario: string | null;
  grupoId: string;
  reglaAplicada: ReglaAplicada;
  tarifaUtilizada: number | null;
  porcentajeAplicado: number | null;
  porcentajePanalAplicado: number | null;
  montoFijoMedicamentoAplicado: number | null;
  cantidadViajes: number;
  importeViaje: number;
}

// §4.2 TEMAS_PENDIENTES.md: resumen de cuántos viajes hizo cada chofer en un
// mes y cuánto se le debe pagar. Desde el 2026-10-04 separa viajes de
// CABA/Provincia (tarifas distintas) en vez de un único cantidadViajes.
export interface ResumenChofer {
  choferId: string;
  choferNombre: string;
  viajesCaba: number;
  viajesProvincia: number;
  totalAPagar: number;
}

// Item 4.4 TEMAS_PENDIENTES.md: carga manual del inicio/fin del recorrido de
// un chofer en un día — SimpliRoute no se usa para esto (requeriría recibir
// webhooks, no implementado), se decidió carga manual más simple.
export interface JornadaChofer {
  id: string;
  choferId: string;
  choferNombre: string;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
}

export interface ResultadoVistaPrevia {
  grupos: GrupoFacturacion[];
  excluidos: PedidoExcluido[];
}
