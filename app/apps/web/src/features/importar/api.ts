import type { TipoServicio } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type { MapeoColumnas, ResultadoImportacion } from "./tipos";

// `fechaEntrega` (YYYY-MM-DD) es obligatoria — documento funcional v6 §4.1:
// se informa antes de subir el archivo y se aplica a todo el lote.
// `tipoServicio` — decisión 2026-09-16: sin esto, el backend asumía Pañal
// siempre (default retrocompatible), así que un Excel de medicamentos
// (Farmaet/Bella Vista) se procesaba con la lógica de pañales y fallaba.
// `clienteId` es obligatorio — se sacó la detección automática por nombre de
// archivo (riesgo real de asignar el cliente equivocado en silencio, ver
// ImportarExcelService).
export async function subirExcel(
  archivo: File,
  fechaEntrega: string,
  tipoServicio: TipoServicio,
  clienteId: string,
): Promise<ResultadoImportacion> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("fechaEntrega", fechaEntrega);
  formData.append("tipoServicio", tipoServicio);
  formData.append("clienteId", clienteId);

  const { data } = await apiClient.post<ResultadoImportacion>("/importaciones", formData);
  return data;
}

export async function confirmarMapeo(params: {
  archivo: File;
  clienteId: string;
  mapeoManual: MapeoColumnas;
  fechaEntrega: string;
  tipoServicio: TipoServicio;
}): Promise<ResultadoImportacion> {
  const formData = new FormData();
  formData.append("archivo", params.archivo);
  formData.append("clienteId", params.clienteId);
  formData.append("mapeoManual", JSON.stringify(params.mapeoManual));
  formData.append("fechaEntrega", params.fechaEntrega);
  formData.append("tipoServicio", params.tipoServicio);

  const { data } = await apiClient.post<ResultadoImportacion>("/importaciones/confirmar-mapeo", formData);
  return data;
}
