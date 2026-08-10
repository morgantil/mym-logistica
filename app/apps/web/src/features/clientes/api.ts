import { apiClient } from "@/lib/api-client";
import type { Cliente } from "./tipos";

export async function listarClientesActivos(): Promise<Cliente[]> {
  const { data } = await apiClient.get<Cliente[]>("/clientes");
  return data;
}
