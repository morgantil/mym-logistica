import type { EstadoPedido } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type { PaginaPedidos, PedidoConErroresBloqueantes, PedidoListado, ResultadoEnvioMasivo } from "./tipos";

export interface ParametrosListarPedidos {
  pagina: number;
  porPagina: number;
  estado?: EstadoPedido;
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
