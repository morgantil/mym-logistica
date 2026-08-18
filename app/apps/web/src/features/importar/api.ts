import { apiClient } from "@/lib/api-client";
import type { MapeoColumnas, ResultadoImportacion } from "./tipos";

// `fechaEntrega` (YYYY-MM-DD) es obligatoria — documento funcional v6 §4.1:
// se informa antes de subir el archivo y se aplica a todo el lote.
export async function subirExcel(
  archivo: File,
  fechaEntrega: string,
  clienteId?: string,
): Promise<ResultadoImportacion> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("fechaEntrega", fechaEntrega);
  if (clienteId) formData.append("clienteId", clienteId);

  const { data } = await apiClient.post<ResultadoImportacion>("/importaciones", formData);
  return data;
}

export async function confirmarMapeo(params: {
  archivo: File;
  clienteId: string;
  mapeoManual: MapeoColumnas;
  fechaEntrega: string;
}): Promise<ResultadoImportacion> {
  const formData = new FormData();
  formData.append("archivo", params.archivo);
  formData.append("clienteId", params.clienteId);
  formData.append("mapeoManual", JSON.stringify(params.mapeoManual));
  formData.append("fechaEntrega", params.fechaEntrega);

  const { data } = await apiClient.post<ResultadoImportacion>("/importaciones/confirmar-mapeo", formData);
  return data;
}
