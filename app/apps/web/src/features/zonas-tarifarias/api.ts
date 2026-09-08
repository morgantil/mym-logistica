import { apiClient } from "@/lib/api-client";
import type { LocalidadZonaTarifaria, PartidoZonaTarifaria, ZonaSimpliRouteZonaTarifaria, ZonaTarifaria } from "./tipos";

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

export async function listarMapeoZonasSimpliRoute(): Promise<ZonaSimpliRouteZonaTarifaria[]> {
  const { data } = await apiClient.get<ZonaSimpliRouteZonaTarifaria[]>("/zonas-tarifarias/zonas-simpliroute");
  return data;
}

export async function asignarZonaSimpliRoute(
  zonaSimpliRouteId: number,
  zonaTarifariaId: string,
): Promise<ZonaSimpliRouteZonaTarifaria> {
  const { data } = await apiClient.post<ZonaSimpliRouteZonaTarifaria>("/zonas-tarifarias/zonas-simpliroute", {
    zonaSimpliRouteId,
    zonaTarifariaId,
  });
  return data;
}

export async function quitarZonaSimpliRoute(zonaSimpliRouteId: number): Promise<void> {
  await apiClient.delete(`/zonas-tarifarias/zonas-simpliroute/${zonaSimpliRouteId}`);
}

export async function listarMapeoPartidos(): Promise<PartidoZonaTarifaria[]> {
  const { data } = await apiClient.get<PartidoZonaTarifaria[]>("/zonas-tarifarias/partidos");
  return data;
}

export async function asignarPartido(partido: string, zonaTarifariaId: string): Promise<PartidoZonaTarifaria> {
  const { data } = await apiClient.post<PartidoZonaTarifaria>("/zonas-tarifarias/partidos", {
    partido,
    zonaTarifariaId,
  });
  return data;
}

export async function quitarPartido(partido: string): Promise<void> {
  await apiClient.delete(`/zonas-tarifarias/partidos/${encodeURIComponent(partido)}`);
}
