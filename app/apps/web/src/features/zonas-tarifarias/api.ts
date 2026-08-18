import { apiClient } from "@/lib/api-client";
import type { LocalidadZonaTarifaria, ZonaTarifaria } from "./tipos";

export async function listarZonasTarifarias(): Promise<ZonaTarifaria[]> {
  const { data } = await apiClient.get<ZonaTarifaria[]>("/zonas-tarifarias");
  return data;
}

export async function crearZonaTarifaria(nombre: string): Promise<ZonaTarifaria> {
  const { data } = await apiClient.post<ZonaTarifaria>("/zonas-tarifarias", { nombre });
  return data;
}

export async function actualizarZonaTarifaria(
  id: string,
  datos: Partial<{ nombre: string; activa: boolean }>,
): Promise<ZonaTarifaria> {
  const { data } = await apiClient.patch<ZonaTarifaria>(`/zonas-tarifarias/${id}`, datos);
  return data;
}

export async function listarMapeoLocalidades(): Promise<LocalidadZonaTarifaria[]> {
  const { data } = await apiClient.get<LocalidadZonaTarifaria[]>("/zonas-tarifarias/localidades");
  return data;
}

export async function asignarLocalidad(localidad: string, zonaTarifariaId: string): Promise<LocalidadZonaTarifaria> {
  const { data } = await apiClient.post<LocalidadZonaTarifaria>("/zonas-tarifarias/localidades", {
    localidad,
    zonaTarifariaId,
  });
  return data;
}

export async function quitarLocalidad(id: string): Promise<void> {
  await apiClient.delete(`/zonas-tarifarias/localidades/${id}`);
}
