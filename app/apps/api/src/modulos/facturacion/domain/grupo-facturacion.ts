import { CabaProvincia, EstadoGrupoFacturacion, TipoServicio } from "@mym/shared-types";

// §32 funcional (trazabilidad): agrupa los pedidos que comparten un viaje
// facturable. Los pedidos nunca se fusionan ni se borran, solo se relacionan
// acá — por eso `pedidoIds` en vez de fusionar sus datos.
export interface GrupoFacturacion {
  id: string;
  clienteId: string;
  mes: number;
  anio: number;
  estado: EstadoGrupoFacturacion;
  reglaAplicada: string;
  tarifaUtilizada: number | null;
  porcentajeAplicado: number | null;
  importeCalculado: number;
  confirmadoEn: Date | null;
  confirmadoPorId: string | null;
  pedidoIds: string[];
}

// Fila de detalle para el reporte mensual (§31 funcional) — un pedido
// facturado con los datos propios (destinatario, chofer) y el resumen del
// viaje al que pertenece. `tarifaUtilizada`/`porcentajeAplicado`/`importe`
// son del VIAJE (grupo), no del pedido individual — un viaje 2×1 o
// unificada agrupa 2 pedidos, y el documento funcional no define una regla
// para "repartir" el importe entre ellos, así que no se inventa una.
export interface PedidoFacturado {
  pedidoId: string;
  fechaProgramada: Date;
  destinatarioNombre: string;
  numeroAfiliado: string;
  direccion: string;
  cabaProvincia: CabaProvincia | null;
  tipoServicio: TipoServicio;
  choferNombre: string | null;
  grupoId: string;
  reglaAplicada: string;
  tarifaUtilizada: number | null;
  porcentajeAplicado: number | null;
  importeViaje: number;
}
