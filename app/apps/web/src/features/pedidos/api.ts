import type {
  EstadoPedido,
  EstadoSimpliroute,
  PrioridadPedido,
  ResolucionDireccion,
  TipoEnvase,
  TipoServicio,
} from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type {
  CampoOrdenPedido,
  PaginaPedidos,
  PedidoConErroresBloqueantes,
  PedidoListado,
  ResultadoEliminacionMasiva,
  ResultadoEnvioMasivo,
} from "./tipos";

export interface ParametrosListarPedidos {
  pagina: number;
  porPagina: number;
  estado?: EstadoPedido;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  bultosDesde?: number;
  bultosHasta?: number;
  busqueda?: string;
  // Filtros combinables agregados 2026-09-16.
  tipoServicio?: TipoServicio;
  zonaId?: string;
  choferId?: string;
  tipoEnvase?: TipoEnvase;
  estadoSimpliroute?: EstadoSimpliroute;
  prioridad?: PrioridadPedido;
  localidad?: string;
  sinEtiquetaImpresa?: boolean;
  ordenarPor?: CampoOrdenPedido;
  direccionOrden?: "asc" | "desc";
}

export async function listarPedidos(parametros: ParametrosListarPedidos): Promise<PaginaPedidos> {
  const { data } = await apiClient.get<PaginaPedidos>("/pedidos", { params: parametros });
  return data;
}

// Decisión 2026-10-04 (reunión con el cliente): "Exportar a Excel" con los
// mismos filtros que estén aplicados en la grilla (sin pagina/porPagina —
// el backend trae todo lo que matchea, sin paginar).
export async function exportarPedidos(
  parametros: Omit<ParametrosListarPedidos, "pagina" | "porPagina">,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/pedidos/exportar", {
    params: parametros,
    responseType: "blob",
  });
  return data;
}

// Remito preimpreso del pedido (ítem reunión 02/10/2026, Pablo Renzo) — ver
// clienteFormatoRemito en tipos.ts: sin formato configurado el backend
// rechaza con 400.
export async function descargarRemito(pedidoId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/pedidos/${pedidoId}/remito`, { responseType: "blob" });
  return data;
}

// Dropdown del filtro de Localidad — valores reales ya cargados.
export async function listarLocalidadesPedidos(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>("/pedidos/localidades");
  return data;
}

export async function revisarPendientesDeEnvio(): Promise<PedidoConErroresBloqueantes[]> {
  const { data } = await apiClient.get<PedidoConErroresBloqueantes[]>("/pedidos/revision");
  return data;
}

export async function actualizarBultos(
  pedidoId: string,
  bultos: number,
  version: number,
): Promise<PedidoListado> {
  const { data } = await apiClient.patch<PedidoListado>(`/pedidos/${pedidoId}/bultos`, {
    bultos,
    version,
  });
  return data;
}

// Decisión 2026-10-04: comentario libre por pedido, editable en cualquier momento.
export async function actualizarComentario(
  pedidoId: string,
  comentario: string,
  version: number,
): Promise<PedidoListado> {
  const { data } = await apiClient.patch<PedidoListado>(`/pedidos/${pedidoId}/comentario`, {
    comentario,
    version,
  });
  return data;
}

// Decisión 2026-09-16: resuelve una "dirección distinta a la registrada en
// el padrón" y desbloquea el envío del pedido (ver validar-envio.ts).
export async function resolverAlertaDireccion(
  pedidoId: string,
  resolucion: ResolucionDireccion,
  version: number,
): Promise<PedidoListado> {
  const { data } = await apiClient.patch<PedidoListado>(`/pedidos/${pedidoId}/resolver-direccion`, {
    resolucion,
    version,
  });
  return data;
}

export async function enviarASimpliRoute(pedidoIds: string[]): Promise<ResultadoEnvioMasivo> {
  const { data } = await apiClient.post<ResultadoEnvioMasivo>("/pedidos/enviar-simpliroute", {
    pedidoIds,
  });
  return data;
}

// Borrado lógico — solo pedidos que todavía no se mandaron a SimpliRoute.
export async function eliminarPedido(pedidoId: string): Promise<void> {
  await apiClient.delete(`/pedidos/${pedidoId}`);
}

// Decisión 2026-09-24: marca uno o varios pedidos como Normal/Urgente/Crítica.
export async function actualizarPrioridad(
  pedidoIds: string[],
  prioridad: PrioridadPedido,
): Promise<{ actualizados: number }> {
  const { data } = await apiClient.patch<{ actualizados: number }>("/pedidos/prioridad", { pedidoIds, prioridad });
  return data;
}

export async function eliminarPedidos(pedidoIds: string[]): Promise<ResultadoEliminacionMasiva> {
  const { data } = await apiClient.post<ResultadoEliminacionMasiva>("/pedidos/eliminar", { pedidoIds });
  return data;
}

export interface ResultadoSincronizacion {
  actualizados: number;
  sinCambios: number;
  errores: { pedidoId: string; errores: string[] }[];
}

// §19 funcional: trae de SimpliRoute el estado real de los pedidos en curso
// y los refleja acá — es lo único que lleva un pedido a Entregado/Fallido.
export async function sincronizarEstados(): Promise<ResultadoSincronizacion> {
  const { data } = await apiClient.post<ResultadoSincronizacion>("/pedidos/sincronizar-estados");
  return data;
}

// Preferencia personal de columnas fijas en la grilla — decisión 2026-09-01.
export async function obtenerColumnasPedidos(): Promise<string[]> {
  const { data } = await apiClient.get<{ columnas: string[] }>("/auth/perfil/columnas-pedidos");
  return data.columnas;
}

export async function actualizarColumnasPedidos(columnas: string[]): Promise<string[]> {
  const { data } = await apiClient.patch<{ columnas: string[] }>("/auth/perfil/columnas-pedidos", {
    columnas,
  });
  return data.columnas;
}
