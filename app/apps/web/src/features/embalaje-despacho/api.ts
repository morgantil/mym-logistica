import { apiClient } from "@/lib/api-client";

export async function descargarEtiquetas(pedidoId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/pedidos/${pedidoId}/etiquetas`, { responseType: "blob" });
  return data;
}

export async function descargarEtiquetaPuntual(pedidoId: string, numeroBulto: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/pedidos/${pedidoId}/etiquetas/${numeroBulto}`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarRemito(pedidoId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/pedidos/${pedidoId}/remito`, { responseType: "blob" });
  return data;
}
