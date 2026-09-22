import { TipoServicioCliente } from "@mym/shared-types";
import { Cliente } from "./cliente";

export interface DatosActualizarCliente {
  nombre?: string;
  activo?: boolean;
  tipoServicio?: TipoServicioCliente;
}

export interface ClientesRepositorio {
  listarActivos(): Promise<Cliente[]>;
  // Para la pantalla de administración: activos e inactivos, nunca los
  // borrados lógicamente (eso ya lo filtra el middleware de Prisma).
  listarTodos(): Promise<Cliente[]>;
  buscarPorId(id: string): Promise<Cliente | null>;
  crear(datos: Omit<Cliente, "id" | "activo">): Promise<Cliente>;
  actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente>;
}

export const CLIENTES_REPOSITORIO = Symbol("CLIENTES_REPOSITORIO");
