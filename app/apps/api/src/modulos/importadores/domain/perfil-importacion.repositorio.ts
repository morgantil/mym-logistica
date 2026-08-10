import { MapeoColumnas } from "./campo-canonico";

export interface PerfilImportacionRepositorio {
  buscarPorCliente(clienteId: string): Promise<MapeoColumnas | null>;
  guardar(clienteId: string, mapeo: MapeoColumnas, usuarioId: string | null): Promise<void>;
}

export const PERFIL_IMPORTACION_REPOSITORIO = Symbol("PERFIL_IMPORTACION_REPOSITORIO");
