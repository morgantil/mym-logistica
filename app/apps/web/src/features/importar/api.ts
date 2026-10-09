import type { TipoServicio } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type {
  DatosReglaImportacion,
  MapeoColumnas,
  ReglaImportacion,
  ResultadoImportacion,
  SinonimoReceta,
  TipoCoincidencia,
} from "./tipos";

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
  // Decisión 2026-09-24: hoja del libro a leer (opcional — queda guardada en el
  // perfil del cliente; sin ella se usa la guardada o la primera).
  nombreHoja?: string,
  // Decisión 2026-09-24: el archivo no trae fila de encabezados (Farmaet).
  // undefined = usar lo guardado para el cliente.
  sinEncabezado?: boolean,
): Promise<ResultadoImportacion> {
  const formData = new FormData();
  if (nombreHoja) formData.append("nombreHoja", nombreHoja);
  if (sinEncabezado !== undefined) formData.append("sinEncabezado", String(sinEncabezado));
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
  nombreHoja?: string;
  sinEncabezado?: boolean;
}): Promise<ResultadoImportacion> {
  const formData = new FormData();
  if (params.nombreHoja) formData.append("nombreHoja", params.nombreHoja);
  if (params.sinEncabezado !== undefined) formData.append("sinEncabezado", String(params.sinEncabezado));
  formData.append("archivo", params.archivo);
  formData.append("clienteId", params.clienteId);
  formData.append("mapeoManual", JSON.stringify(params.mapeoManual));
  formData.append("fechaEntrega", params.fechaEntrega);
  formData.append("tipoServicio", params.tipoServicio);

  const { data } = await apiClient.post<ResultadoImportacion>("/importaciones/confirmar-mapeo", formData);
  return data;
}

export async function listarReglas(clienteId: string, tipoServicio: TipoServicio): Promise<ReglaImportacion[]> {
  const { data } = await apiClient.get<ReglaImportacion[]>("/reglas-importacion", {
    params: { clienteId, tipoServicio },
  });
  return data;
}

export async function crearRegla(datos: DatosReglaImportacion): Promise<ReglaImportacion> {
  const { data } = await apiClient.post<ReglaImportacion>("/reglas-importacion", datos);
  return data;
}

export async function actualizarRegla(id: string, datos: DatosReglaImportacion): Promise<ReglaImportacion> {
  const { data } = await apiClient.put<ReglaImportacion>(`/reglas-importacion/${id}`, datos);
  return data;
}

export async function eliminarRegla(id: string): Promise<void> {
  await apiClient.delete(`/reglas-importacion/${id}`);
}

export async function listarSinonimosReceta(): Promise<SinonimoReceta[]> {
  const { data } = await apiClient.get<SinonimoReceta[]>("/sinonimos-receta");
  return data;
}

export async function crearSinonimoReceta(datos: {
  valorOrigen: string;
  valorCanonico: string;
  tipoCoincidencia: TipoCoincidencia;
  orden: number;
}): Promise<SinonimoReceta> {
  const { data } = await apiClient.post<SinonimoReceta>("/sinonimos-receta", datos);
  return data;
}

export async function eliminarSinonimoReceta(id: string): Promise<void> {
  await apiClient.delete(`/sinonimos-receta/${id}`);
}

// Item: filtro "Importado por" en Pedidos (reunión 2026-10-09) — solo
// usuarios que ya importaron algo, no la lista completa del sistema.
export async function listarUsuariosImportadores(): Promise<{ id: string; nombre: string }[]> {
  const { data } = await apiClient.get<{ id: string; nombre: string }[]>("/importaciones/usuarios");
  return data;
}
