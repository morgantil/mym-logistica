import { TipoServicio } from "@mym/shared-types";
import { ReglaImportacion } from "./reglas-importacion";

export interface DatosReglaImportacion {
  clienteId: string;
  tipoServicio: TipoServicio;
  campoOrigen: ReglaImportacion["campoOrigen"];
  tipoCoincidencia: ReglaImportacion["tipoCoincidencia"];
  valor: string;
  accion: ReglaImportacion["accion"];
  campoDestino: ReglaImportacion["campoDestino"];
  valorDestino: string;
  orden: number;
  activa: boolean;
}

export interface ReglaImportacionGuardada extends ReglaImportacion {
  tipoServicio: TipoServicio;
}

// Reglas de importación editables — ver ReglaImportacion en schema.prisma.
export interface ReglaImportacionRepositorio {
  listar(filtro: { clienteId?: string; tipoServicio?: TipoServicio }): Promise<ReglaImportacionGuardada[]>;
  // Solo las activas de un cliente + tipo — lo único que necesita el importador en caliente.
  listarActivas(clienteId: string, tipoServicio: TipoServicio): Promise<ReglaImportacion[]>;
  crear(datos: DatosReglaImportacion, usuarioId: string): Promise<ReglaImportacionGuardada>;
  actualizar(id: string, datos: DatosReglaImportacion, usuarioId: string): Promise<ReglaImportacionGuardada>;
  eliminar(id: string): Promise<void>;
}

export const REGLA_IMPORTACION_REPOSITORIO = Symbol("REGLA_IMPORTACION_REPOSITORIO");
