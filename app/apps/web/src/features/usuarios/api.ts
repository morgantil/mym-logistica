import { apiClient } from "@/lib/api-client";
import type { DatosActualizarUsuario, DatosCrearUsuario, Usuario } from "./tipos";

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await apiClient.get<Usuario[]>("/usuarios");
  return data;
}

export async function crearUsuario(
  datos: DatosCrearUsuario,
): Promise<{ usuario: Usuario; passwordTemporal: string }> {
  const { data } = await apiClient.post("/usuarios", datos);
  return data;
}

export async function actualizarUsuario(id: string, datos: DatosActualizarUsuario): Promise<Usuario> {
  const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}`, datos);
  return data;
}

export async function actualizarClientesPermitidos(id: string, clienteIds: string[]): Promise<void> {
  await apiClient.patch(`/usuarios/${id}/clientes-permitidos`, { clienteIds });
}

export async function resetearPassword(id: string): Promise<{ passwordTemporal: string }> {
  const { data } = await apiClient.post(`/usuarios/${id}/resetear-password`);
  return data;
}
