import { EstadoGrupoFacturacion, TipoServicio } from "@mym/shared-types";

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
  // Solo en UNIFICADA (ver ViajeFacturable.detalleUnificacion en el motor):
  // reemplaza a porcentajeAplicado — el lado pañal sigue siendo un %, ver
  // DOCUMENTO TECNICO.md historial 2026-09-08.
  porcentajePanalAplicado: number | null;
  // Decisión 2026-09-12: el lado medicamento dejó de ser un % (ver
  // montoFijoMedicamentoAplicado) — este campo queda solo por filas
  // históricas, no se escribe más para viajes nuevos.
  porcentajeMedicamentoAplicado: number | null;
  montoFijoMedicamentoAplicado: number | null;
  // Solo en una unificación ENTRE clientes distintos — trazabilidad del
  // pedido/cliente "socio" que generó la unificación (ver unificacion-cruzada.ts).
  pedidoSocioId: string | null;
  clienteSocioId: string | null;
  // Cuántos viajes representa esta fila — decisión 2026-09-11 (ver
  // motor-facturacion.ts, calcularViajesPorPeso). Siempre 1 salvo en 2x1,
  // donde puede ser >1 si algún Pedido agrupa varios pedidos originales.
  cantidadViajes: number;
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
  // N.º de Pedido interno (§8.2 funcional), no el UUID — decisión 2026-09-11:
  // Leonardo pidió más info visible para quien hace la liquidación.
  numero: number;
  fechaProgramada: Date;
  destinatarioNombre: string;
  numeroAfiliado: string;
  direccion: string;
  zonaTarifariaId: string | null;
  zonaTarifariaNombre: string | null;
  tipoServicio: TipoServicio;
  choferNombre: string | null;
  grupoId: string;
  reglaAplicada: string;
  tarifaUtilizada: number | null;
  porcentajeAplicado: number | null;
  porcentajePanalAplicado: number | null;
  porcentajeMedicamentoAplicado: number | null;
  montoFijoMedicamentoAplicado: number | null;
  cantidadViajes: number;
  importeViaje: number;
}
