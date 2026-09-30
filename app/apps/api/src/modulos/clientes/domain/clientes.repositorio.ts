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
  // Decisión 2026-09-29 (Leonardo, tras encontrar tarifas/montos mal
  // cargados para el tipo de servicio equivocado): antes de sacarle a un
  // cliente un tipo de servicio que ya usa, avisa qué quedaría huérfano
  // (tarifas, montos, reglas, pedidos...) en vez de dejarlo pasar en
  // silencio, como ya pasaba con las tarifas. Vacío = se puede cambiar sin
  // problema. `nuevoTipo` AMBOS nunca tiene nada incompatible.
  buscarConfiguracionIncompatible(clienteId: string, nuevoTipo: TipoServicioCliente): Promise<string[]>;
}

export const CLIENTES_REPOSITORIO = Symbol("CLIENTES_REPOSITORIO");
