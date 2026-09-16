import { TipoServicio } from "@mym/shared-types";
import { MapeoColumnas } from "./campo-canonico";

export interface PerfilImportacionRepositorio {
  // Un cliente TipoServicioCliente.AMBOS tiene hasta dos perfiles — uno por
  // TipoServicio (pañales y medicamentos), ver comentario en schema.prisma.
  buscarPorCliente(clienteId: string, tipoServicio: TipoServicio): Promise<MapeoColumnas | null>;
  guardar(
    clienteId: string,
    tipoServicio: TipoServicio,
    mapeo: MapeoColumnas,
    usuarioId: string | null,
  ): Promise<void>;
}

export const PERFIL_IMPORTACION_REPOSITORIO = Symbol("PERFIL_IMPORTACION_REPOSITORIO");
