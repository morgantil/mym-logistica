import type { TipoGastoChofer } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type { GastoChofer, ResumenImportacionGastos } from "./tipos";

export interface FiltroGastos {
  tipo?: TipoGastoChofer;
  choferId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  soloSinAsignar?: boolean;
}

// `mes`/`anio` obligatorios — la hoja de peajes del archivo real no trae
// fecha por fila, ver GastosChoferesService.importar (backend).
export async function importarGastos(archivo: File, mes: number, anio: number): Promise<ResumenImportacionGastos[]> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("mes", String(mes));
  formData.append("anio", String(anio));
  const { data } = await apiClient.post<ResumenImportacionGastos[]>("/gastos-choferes/importar", formData);
  return data;
}

export async function listarGastos(filtro: FiltroGastos): Promise<GastoChofer[]> {
  const { data } = await apiClient.get<GastoChofer[]>("/gastos-choferes", { params: filtro });
  return data;
}

export async function asignarChofer(id: string, choferId: string): Promise<GastoChofer> {
  const { data } = await apiClient.patch<GastoChofer>(`/gastos-choferes/${id}/chofer`, { choferId });
  return data;
}

// ABM manual (item 14.1 TEMAS_PENDIENTES.md, reunión 2026-10-06) — además
// del import en bloque, un gasto suelto se puede cargar/editar/borrar a
// mano; el chofer siempre se elige de un desplegable (choferId).
export interface DatosGasto {
  tipo: TipoGastoChofer;
  fecha: string;
  monto: number;
  choferId: string;
  proveedor?: string;
  comprobante?: string;
}

export async function crearGasto(datos: DatosGasto): Promise<GastoChofer> {
  const { data } = await apiClient.post<GastoChofer>("/gastos-choferes", datos);
  return data;
}

export async function actualizarGasto(id: string, datos: Partial<DatosGasto>): Promise<GastoChofer> {
  const { data } = await apiClient.patch<GastoChofer>(`/gastos-choferes/${id}`, datos);
  return data;
}

export async function eliminarGasto(id: string): Promise<void> {
  await apiClient.delete(`/gastos-choferes/${id}`);
}

export async function descargarReporteGastos(filtro: FiltroGastos): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/gastos-choferes/reporte-excel", {
    params: filtro,
    responseType: "blob",
  });
  return data;
}
