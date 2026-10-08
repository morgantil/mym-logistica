import { TipoGastoChofer } from "@mym/shared-types";
import { DatosFiscalesCombustible, GastoChofer } from "./gasto-chofer";

export interface DatosCrearGastoChofer extends DatosFiscalesCombustible {
  tipo: TipoGastoChofer;
  fecha: Date;
  monto: number;
  choferId: string | null;
  choferNombre: string | null;
  choferNombreOriginal: string;
  proveedor: string | null;
  comprobante: string | null;
  archivoOrigen: string;
}

// Campos editables de un gasto a mano (item 14.1 TEMAS_PENDIENTES.md,
// reunión 2026-10-06) — `choferNombreOriginal`/`archivoOrigen` no entran acá
// porque el service los completa solo (ver GastosChoferesService.crear):
// una carga manual siempre elige un chofer real del desplegable, así que no
// hay "texto original" distinto que preservar.
export interface DatosActualizarGastoChofer extends Partial<DatosFiscalesCombustible> {
  tipo?: TipoGastoChofer;
  fecha?: Date;
  monto?: number;
  choferId?: string;
  choferNombre?: string;
  proveedor?: string | null;
  comprobante?: string | null;
}

export interface FiltroGastosChofer {
  tipo?: TipoGastoChofer;
  choferId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  // true = solo los que no matchearon ningún chofer al importar (cola de
  // resolución manual, ver GastosChoferesService.asignarChofer).
  soloSinAsignar?: boolean;
}

export interface GastosChoferesRepositorio {
  crearVarios(datos: DatosCrearGastoChofer[]): Promise<number>;
  // ABM manual (item 14.1 TEMAS_PENDIENTES.md) — distinto de crearVarios
  // (import en bloque): un solo gasto cargado a mano.
  crear(datos: DatosCrearGastoChofer): Promise<GastoChofer>;
  actualizar(id: string, datos: DatosActualizarGastoChofer): Promise<GastoChofer>;
  eliminar(id: string): Promise<void>;
  listar(filtro: FiltroGastosChofer): Promise<GastoChofer[]>;
  buscarPorId(id: string): Promise<GastoChofer | null>;
  asignarChofer(id: string, choferId: string, choferNombre: string): Promise<GastoChofer>;
}

export const GASTOS_CHOFERES_REPOSITORIO = Symbol("GASTOS_CHOFERES_REPOSITORIO");
