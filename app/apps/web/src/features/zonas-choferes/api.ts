import { apiClient } from "@/lib/api-client";
import type { Chofer, Zona, ZonaConChofer } from "./tipos";

export async function listarZonasConChofer(): Promise<ZonaConChofer[]> {
  const { data } = await apiClient.get<ZonaConChofer[]>("/zonas", { params: { conChofer: "true" } });
  return data;
}

export async function crearZona(nombre: string): Promise<Zona> {
  const { data } = await apiClient.post<Zona>("/zonas", { nombre });
  return data;
}

export async function actualizarZona(id: string, nombre: string): Promise<Zona> {
  const { data } = await apiClient.patch<Zona>(`/zonas/${id}`, { nombre });
  return data;
}

export async function asignarChofer(zonaId: string, choferId: string | null): Promise<ZonaConChofer> {
  const { data } = await apiClient.patch<ZonaConChofer>(`/zonas/${zonaId}/chofer`, { choferId });
  return data;
}

export async function listarChoferesActivos(): Promise<Chofer[]> {
  const { data } = await apiClient.get<Chofer[]>("/choferes");
  return data;
}

export async function listarTodosLosChoferes(): Promise<Chofer[]> {
  const { data } = await apiClient.get<Chofer[]>("/choferes", { params: { incluirInactivos: "true" } });
  return data;
}

export async function crearChofer(nombre: string): Promise<Chofer> {
  const { data } = await apiClient.post<Chofer>("/choferes", { nombre });
  return data;
}

export async function actualizarChofer(
  id: string,
  datos: Partial<{ nombre: string; activo: boolean }>,
): Promise<Chofer> {
  const { data } = await apiClient.patch<Chofer>(`/choferes/${id}`, datos);
  return data;
}
