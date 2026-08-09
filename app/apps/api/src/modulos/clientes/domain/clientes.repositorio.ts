import { Cliente } from "./cliente";

export interface ClientesRepositorio {
  listarActivos(): Promise<Cliente[]>;
  buscarPorId(id: string): Promise<Cliente | null>;
  crear(datos: Omit<Cliente, "id" | "activo">): Promise<Cliente>;
}

export const CLIENTES_REPOSITORIO = Symbol("CLIENTES_REPOSITORIO");
