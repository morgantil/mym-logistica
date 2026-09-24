import { TipoServicio } from "@mym/shared-types";
import { MapeoColumnas } from "./campo-canonico";

export interface PerfilGuardado {
  mapeo: MapeoColumnas;
  // Hoja del Excel a leer — null = la primera.
  nombreHoja: string | null;
}

export interface PerfilImportacionRepositorio {
  // Un cliente TipoServicioCliente.AMBOS tiene hasta dos perfiles — uno por
  // TipoServicio (pañales y medicamentos), ver comentario en schema.prisma.
  buscarPorCliente(clienteId: string, tipoServicio: TipoServicio): Promise<PerfilGuardado | null>;
  guardar(
    clienteId: string,
    tipoServicio: TipoServicio,
    mapeo: MapeoColumnas,
    usuarioId: string | null,
    nombreHoja?: string | null,
  ): Promise<void>;
  actualizarNombreHoja(
    clienteId: string,
    tipoServicio: TipoServicio,
    nombreHoja: string | null,
    usuarioId: string | null,
  ): Promise<void>;
}

export const PERFIL_IMPORTACION_REPOSITORIO = Symbol("PERFIL_IMPORTACION_REPOSITORIO");
