import type { EstadoPedido } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";

export async function obtenerPedidosPorEstado(): Promise<Partial<Record<EstadoPedido, number>>> {
  const { data } = await apiClient.get<Partial<Record<EstadoPedido, number>>>(
    "/dashboard/pedidos-por-estado",
  );
  return data;
}
