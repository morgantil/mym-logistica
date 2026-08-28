import type { EstadoPedido } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type { PaginaPedidos, PedidoConErroresBloqueantes, PedidoListado, ResultadoEnvioMasivo } from "./tipos";

export interface ParametrosListarPedidos {
  pagina: number;
  porPagina: number;
  estado?: EstadoPedido;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export async function listarPedidos(parametros: ParametrosListarPedidos): Promise<PaginaPedidos> {
  const { data } = await apiClient.get<PaginaPedidos>("/pedidos", { params: parametros });
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

export async function enviarASimpliRoute(pedidoIds: string[]): Promise<ResultadoEnvioMasivo> {
  const { data } = await apiClient.post<ResultadoEnvioMasivo>("/pedidos/enviar-simpliroute", {
    pedidoIds,
  });
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
