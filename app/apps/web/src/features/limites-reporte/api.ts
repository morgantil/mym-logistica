import type { TipoReporte } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type { LimiteReporte } from "./tipos";

export async function listarLimitesReporte(): Promise<LimiteReporte[]> {
  const { data } = await apiClient.get<LimiteReporte[]>("/limites-reporte");
  return data;
}

export async function actualizarLimiteReporte(reporte: TipoReporte, maxDias: number): Promise<LimiteReporte> {
  const { data } = await apiClient.patch<LimiteReporte>(`/limites-reporte/${reporte}`, { maxDias });
  return data;
}
