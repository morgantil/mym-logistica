import type { FormatoRemito, TipoServicioCliente } from "@mym/shared-types";
import { apiClient } from "@/lib/api-client";
import type { Cliente } from "./tipos";

export async function listarClientesActivos(): Promise<Cliente[]> {
  const { data } = await apiClient.get<Cliente[]>("/clientes");
  return data;
}

export async function listarTodosLosClientes(): Promise<Cliente[]> {
  const { data } = await apiClient.get<Cliente[]>("/clientes", {
    params: { incluirInactivos: "true" },
  });
  return data;
}

export interface DatosCliente {
  nombre: string;
  tipoServicio: TipoServicioCliente;
  facturaPorCordon?: boolean;
}

export async function crearCliente(datos: DatosCliente): Promise<Cliente> {
  const { data } = await apiClient.post<Cliente>("/clientes", datos);
  return data;
}

export async function actualizarCliente(
  id: string,
  datos: Partial<DatosCliente & { activo: boolean; formatoRemito: FormatoRemito | null; usaCarga3: boolean }>,
): Promise<Cliente> {
  const { data } = await apiClient.patch<Cliente>(`/clientes/${id}`, datos);
  return data;
}
