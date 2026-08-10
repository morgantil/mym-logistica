import { apiClient } from "@/lib/api-client";
import type { MapeoColumnas, ResultadoImportacion } from "./tipos";

export async function subirExcel(archivo: File, clienteId?: string): Promise<ResultadoImportacion> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  if (clienteId) formData.append("clienteId", clienteId);

  const { data } = await apiClient.post<ResultadoImportacion>("/importaciones", formData);
  return data;
}

export async function confirmarMapeo(params: {
  archivo: File;
  clienteId: string;
  mapeoManual: MapeoColumnas;
}): Promise<ResultadoImportacion> {
  const formData = new FormData();
  formData.append("archivo", params.archivo);
  formData.append("clienteId", params.clienteId);
  formData.append("mapeoManual", JSON.stringify(params.mapeoManual));

  const { data } = await apiClient.post<ResultadoImportacion>("/importaciones/confirmar-mapeo", formData);
  return data;
}
