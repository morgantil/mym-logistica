import { TipoGastoChofer } from "@mym/shared-types";
import { GastoChofer } from "./gasto-chofer";

export interface DatosCrearGastoChofer {
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
  listar(filtro: FiltroGastosChofer): Promise<GastoChofer[]>;
  buscarPorId(id: string): Promise<GastoChofer | null>;
  asignarChofer(id: string, choferId: string, choferNombre: string): Promise<GastoChofer>;
}

export const GASTOS_CHOFERES_REPOSITORIO = Symbol("GASTOS_CHOFERES_REPOSITORIO");
