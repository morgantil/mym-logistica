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

export async function descargarReporteGastos(filtro: FiltroGastos): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/gastos-choferes/reporte-excel", {
    params: filtro,
    responseType: "blob",
  });
  return data;
}
