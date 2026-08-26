import { apiClient } from "@/lib/api-client";
import type { Chofer, DatosChofer, DatosVehiculo, Vehiculo, Zona } from "./tipos";

export async function listarZonas(): Promise<Zona[]> {
  const { data } = await apiClient.get<Zona[]>("/zonas");
  return data;
}

export async function listarChoferes(): Promise<Chofer[]> {
  const { data } = await apiClient.get<Chofer[]>("/choferes");
  return data;
}

export async function crearChofer(datos: DatosChofer): Promise<Chofer> {
  const { data } = await apiClient.post<Chofer>("/choferes", datos);
  return data;
}

export async function actualizarChofer(id: number, datos: DatosChofer): Promise<Chofer> {
  const { data } = await apiClient.patch<Chofer>(`/choferes/${id}`, datos);
  return data;
}

export async function eliminarChofer(id: number): Promise<void> {
  await apiClient.delete(`/choferes/${id}`);
}

export async function listarVehiculos(): Promise<Vehiculo[]> {
  const { data } = await apiClient.get<Vehiculo[]>("/vehiculos");
  return data;
}

export async function crearVehiculo(datos: DatosVehiculo): Promise<Vehiculo> {
  const { data } = await apiClient.post<Vehiculo>("/vehiculos", datos);
  return data;
}

export async function actualizarVehiculo(id: number, datos: DatosVehiculo): Promise<Vehiculo> {
  const { data } = await apiClient.patch<Vehiculo>(`/vehiculos/${id}`, datos);
  return data;
}

export async function eliminarVehiculo(id: number): Promise<void> {
  await apiClient.delete(`/vehiculos/${id}`);
}

// Botón "Sincronizar ahora" — el resto de las lecturas se refresca solo
// cuando el backend detecta que el cache está vencido.
export async function sincronizarConSimpliRoute(): Promise<{ zonas: number; choferes: number; vehiculos: number }> {
  const { data } = await apiClient.post("/simpliroute-cache/sincronizar");
  return data;
}
